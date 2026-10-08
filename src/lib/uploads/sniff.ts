/**
 * What kind of file a set of bytes actually is.
 *
 * An upload's declared `Content-Type` is a claim by whoever sent it, so every decision here is made
 * from the bytes. The allowlist is deliberately short: images a browser can render, and nothing
 * that could be interpreted as markup.
 *
 * Dimensions are read from the header rather than by decoding the file, so this stays a few
 * hundred bytes of arithmetic and runs on the first chunk of an upload.
 */
import type { MediaType } from "#/lib/db/schema/types.ts";

export interface ImageTypeInfo {
  mimeType: string;
  extension: string;
  kind: MediaType;
}

const ALLOWED: readonly ImageTypeInfo[] = [
  { mimeType: "image/jpeg", extension: "jpg", kind: "image" },
  { mimeType: "image/png", extension: "png", kind: "image" },
  { mimeType: "image/webp", extension: "webp", kind: "image" },
  { mimeType: "image/avif", extension: "avif", kind: "image" },
];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function describeUploadError(bytes: Uint8Array): string | null {
  if (bytes.length === 0) return "That file is empty.";
  const type = sniffImageType(bytes);
  if (!type) {
    return "Upload a JPEG, PNG, WebP or AVIF image. SVG and documents are not accepted.";
  }
  if (hasExif(bytes, type.mimeType)) {
    // The browser strips EXIF when it re-encodes, so this only catches a raw file that was posted
    // as-is. EXIF carries GPS coordinates and camera serials, so it never gets stored.
    return "That photo still has camera data on it. Re-export or re-save the image and try again.";
  }
  return null;
}

export function sniffImageType(bytes: Uint8Array): ImageTypeInfo | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + length));

  if (bytes.length >= 2 && view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8) {
    return match("image/jpeg");
  }
  if (bytes.length >= 8 && ascii(0, 8) === "\x89PNG\r\n\x1a\n") {
    return match("image/png");
  }
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return match("image/webp");
  }
  if (bytes.length >= 12 && ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    return brand === "avif" || brand === "avis" ? match("image/avif") : null;
  }
  return null;

  function match(mimeType: string) {
    return ALLOWED.find((t) => t.mimeType === mimeType) ?? null;
  }
}

/** True when a JPEG carries an APP1/Exif segment, before any of the compressed scan data. */
function hasExif(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType !== "image/jpeg") return false;

  let offset = 2;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (offset + 4 <= bytes.length) {
    if (view.getUint8(offset) !== 0xff) return false;
    const marker = view.getUint8(offset + 1);
    // A marker without a length means the scan data started; Exif would have come first.
    if (marker === 0xda || marker === 0xd9) return false;
    const length = view.getUint16(offset + 2);
    if (length < 2) return false;
    if (marker === 0xe1) {
      const payload = String.fromCharCode(...bytes.subarray(offset + 4, offset + 4 + 4));
      return payload === "Exif";
    }
    offset += 2 + length;
  }
  return false;
}

/**
 * Largest edge a real header can plausibly claim.
 *
 * A file only has to start with a valid signature to be sniffed, so the bytes after it can be
 * anything — including a "width" of four billion, which no column would accept. Anything outside
 * this range is a header that does not mean what it says, and is treated like no header at all.
 */
const MAX_EDGE_PIXELS = 65_535;

/**
 * Pixel dimensions from the file header, or `null` when the header does not say.
 *
 * Layouts are read, not decoded: PNG's IHDR, JPEG's SOFn markers, and the WebP/AVIF variants we
 * accept. A wrong-but-plausible number here would only mis-size a layout, so anything unrecognised
 * or implausible returns null and the UI falls back to a plain image.
 */
export function readImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + length));

  if (ascii(0, 8) === "\x89PNG\r\n\x1a\n" && bytes.length >= 24) {
    // IHDR is always the first chunk: length, type, width, height.
    return plausible({ width: view.getUint32(16), height: view.getUint32(20) });
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return plausible(readJpegDimensions(view));
  }

  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return plausible(readWebpDimensions(view));
  }

  if (ascii(4, 4) === "ftyp") {
    return plausible(readIsoBmffDimensions(view));
  }

  return null;
}

function plausible(size: { width: number; height: number } | null) {
  if (!size) return null;
  const { width, height } = size;
  return width > 0 && height > 0 && width <= MAX_EDGE_PIXELS && height <= MAX_EDGE_PIXELS
    ? size
    : null;
}

function readJpegDimensions(view: DataView): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 9 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;
    const marker = view.getUint8(offset + 1);
    // SOF0-SOF15 carry the frame size; DHT/JPG/DAC sit in the same numeric band but are not frames.
    const isFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrame) {
      return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
    }
    if (marker === 0xda || marker === 0xd9) return null;
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

function readWebpDimensions(view: DataView): { width: number; height: number } | null {
  const format = String.fromCharCode(
    view.getUint8(12),
    view.getUint8(13),
    view.getUint8(14),
    view.getUint8(15),
  );
  if (format === "VP8X" && view.byteLength >= 26) {
    // Flags and three reserved bytes, then the canvas size minus one as two 24-bit LE fields.
    const width = 1 + (view.getUint8(20) | (view.getUint8(21) << 8) | (view.getUint8(22) << 16));
    const height = 1 + (view.getUint8(23) | (view.getUint8(24) << 8) | (view.getUint8(25) << 16));
    return { width, height };
  }
  if (format === "VP8 " && view.byteLength >= 30) {
    return {
      width: view.getUint16(26) & 0x3fff,
      height: view.getUint16(28) & 0x3fff,
    };
  }
  if (format === "VP8L" && view.byteLength >= 25) {
    const bits = view.getUint32(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function readIsoBmffDimensions(view: DataView): { width: number; height: number } | null {
  // Walk the boxes to `ispe`, which is where ISOBMFF stores the real pixel size.
  let offset = 0;
  while (offset + 8 <= view.byteLength) {
    const size = view.getUint32(offset);
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7),
    );
    if (size < 8 || offset + size > view.byteLength) return null;
    if (type === "ispe" && offset + 16 <= view.byteLength) {
      return { width: view.getUint32(offset + 12), height: view.getUint32(offset + 8) };
    }
    offset += size;
  }
  return null;
}

/**
 * Storage key for an upload: random, with the month it was taken for eyeballing in a file listing.
 *
 * Kept to a single path segment on purpose. A key with a slash in it needs a splat route to serve,
 * and it also has to be defended against `..` — a flat key is one regex and one route parameter.
 */
export function buildStorageKey(extension: string, now = new Date()): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}-${crypto.randomUUID()}.${extension}`;
}
