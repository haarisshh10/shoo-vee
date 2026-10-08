import { describe, expect, it } from "vite-plus/test";

import {
  MAX_UPLOAD_BYTES,
  buildStorageKey,
  describeUploadError,
  readImageDimensions,
  sniffImageType,
} from "#/lib/uploads/sniff.ts";

/** Minimal valid headers, built so each test only states what it is about. */
const jpeg = (body: readonly number[] = []) => Uint8Array.from([0xff, 0xd8, ...body]);
const png = () =>
  Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0,
    200, 0, 0, 0, 100,
  ]);
const webp = (chunk: string) =>
  Uint8Array.from([
    ...Array.from("RIFF", (c) => c.charCodeAt(0)),
    0,
    0,
    0,
    0,
    ...Array.from("WEBP", (c) => c.charCodeAt(0)),
    ...Array.from(chunk, (c) => c.charCodeAt(0)),
  ]);
const avif = () =>
  Uint8Array.from([
    0,
    0,
    0,
    32,
    ...Array.from("ftypavif", (c) => c.charCodeAt(0)),
    ...new Array(20).fill(0),
  ]);

describe("sniffImageType", () => {
  it("identifies each allowed format from its own signature", () => {
    expect(sniffImageType(jpeg())?.mimeType).toBe("image/jpeg");
    expect(sniffImageType(png())?.mimeType).toBe("image/png");
    expect(sniffImageType(webp("VP8 "))?.mimeType).toBe("image/webp");
    expect(sniffImageType(avif())?.mimeType).toBe("image/avif");
  });

  it("picks the extension from the type it found, never from a filename", () => {
    expect(sniffImageType(png())?.extension).toBe("png");
    expect(sniffImageType(jpeg())?.extension).toBe("jpg");
  });

  it("refuses anything that is not an allowed image", () => {
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const mp4 = Uint8Array.from([0, 0, 0, 24, ...Array.from("ftypmp42", (c) => c.charCodeAt(0))]);

    for (const bytes of [html, svg, pdf, mp4, new Uint8Array(0)]) {
      expect(sniffImageType(bytes)).toBeNull();
    }
  });

  it("goes by the bytes, not by what is inside them", () => {
    // HTML and SVG reach a browser as markup, so a file that carries a valid image signature is
    // served as that image type with nosniff — it is never interpreted as a document.
    const polyglot = Uint8Array.from([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
      ...Array.from("<img src=x onerror=alert(1)>", (c) => c.charCodeAt(0)),
    ]);
    expect(sniffImageType(polyglot)?.mimeType).toBe("image/png");
    expect(describeUploadError(polyglot)).toBeNull();
  });
});

describe("readImageDimensions", () => {
  it("reads PNG size from IHDR", () => {
    expect(readImageDimensions(png())).toEqual({ width: 200, height: 100 });
  });

  it("reads JPEG size from the first frame header", () => {
    // SOF0, length 0x0011, precision 8, height 600, width 800.
    const frame = [0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x58, 0x03, 0x20];
    expect(readImageDimensions(jpeg(frame))).toEqual({ width: 800, height: 600 });
  });

  it("reads WebP canvas size for the extended format", () => {
    // Flags and reserved padding, then 200-1 and 400-1 as 24-bit little-endian fields.
    const bytes = new Uint8Array([
      ...webp("VP8X"),
      0x10,
      0,
      0,
      0,
      0xc7,
      0x00,
      0x00,
      0x8f,
      0x01,
      0x00,
    ]);
    expect(readImageDimensions(bytes)).toEqual({ width: 200, height: 400 });
  });

  it("returns null rather than guessing when the header says nothing", () => {
    expect(readImageDimensions(jpeg())).toBeNull();
    expect(readImageDimensions(avif())).toBeNull();
  });

  it("returns null for a size no real image could have", () => {
    // A valid signature with garbage after it: the bytes sniff as PNG, and the "size" they claim
    // is four billion pixels across. Storing that would fail, so it reads as no size at all.
    const garbage = new Uint8Array(64);
    garbage.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    new DataView(garbage.buffer).setUint32(16, 4_000_000_000);
    expect(readImageDimensions(garbage)).toBeNull();

    const zero = png();
    new DataView(zero.buffer).setUint32(20, 0);
    expect(readImageDimensions(zero)).toBeNull();
  });
});

describe("describeUploadError", () => {
  it("explains an empty file and an unsupported one in customer words", () => {
    expect(describeUploadError(new Uint8Array(0))).toBe("That file is empty.");
    expect(describeUploadError(new TextEncoder().encode("<svg/>"))).toContain("JPEG, PNG, WebP");
  });

  it("rejects a JPEG that still carries camera data", () => {
    const withExif = jpeg([
      0xff,
      0xe1,
      0x00,
      0x10,
      ...Array.from("Exif", (c) => c.charCodeAt(0)),
      ...new Array(12).fill(0),
      0xff,
      0xda,
      0x00,
      0x02,
    ]);
    expect(describeUploadError(withExif)).toContain("camera data");
  });

  it("accepts a JPEG with no Exif segment", () => {
    const plain = jpeg([
      0xff, 0xe0, 0x00, 0x08, 0x4a, 0x46, 0x49, 0x46, 0x00, 0xff, 0xda, 0x00, 0x02,
    ]);
    expect(describeUploadError(plain)).toBeNull();
  });
});

describe("buildStorageKey", () => {
  it("is random, dated, and keeps the extension", () => {
    const keys = new Set(
      Array.from({ length: 100 }, () => buildStorageKey("jpg", new Date("2026-12-12T10:00:00Z"))),
    );
    expect(keys.size).toBe(100);
    for (const key of keys) expect(key).toMatch(/^2026-12-[0-9a-f-]{36}\.jpg$/);
  });
});

describe("MAX_UPLOAD_BYTES", () => {
  it("is ten megabytes", () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe("stored upload paths", () => {
  it("accepts the path the uploader produces and absolute links, but nothing else", async () => {
    const { mediaUrl } = await import("#/lib/uploads/schema.ts");

    expect(
      mediaUrl.safeParse("/uploads/2026-10-28ab934f-12d2-459d-bcd7-23650169f17d.png").success,
    ).toBe(true);
    expect(mediaUrl.safeParse("https://images.example.dev/shot.jpg").success).toBe(true);
    // The path must match the key the uploader actually generates, so a crafted value cannot point
    // a stored row at a document.
    expect(mediaUrl.safeParse("/uploads/../../etc/passwd").success).toBe(false);
    expect(mediaUrl.safeParse("/uploads/2026-10-x.svg").success).toBe(false);
    expect(mediaUrl.safeParse("javascript:alert(1)").success).toBe(false);
    expect(mediaUrl.safeParse("data:text/html,<script>alert(1)</script>").success).toBe(false);
  });
});
