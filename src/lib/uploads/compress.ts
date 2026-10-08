/**
 * Re-encodes an image in the browser before it is uploaded.
 *
 * Two reasons, one of which is a product requirement rather than an optimisation: a phone photo is
 * several megabytes and most marketplaces never need that, and the EXIF block that comes with it
 * carries GPS coordinates and camera serials. Drawing to a canvas and exporting drops the metadata
 * as a side effect, so a customer does not have to think about it.
 *
 * Compression is best-effort. If the browser cannot decode the file or refuses to encode it, the
 * original is uploaded — the server still sniffs it, and the EXIF check there is the backstop.
 */

/** Longest edge of the uploaded image. Larger than this shows up as a blur on a phone. */
const MAX_EDGE = 1600;
const WEBP_QUALITY = 0.85;

export interface CompressedImage {
  file: File;
  width: number;
  height: number;
}

/** True when the browser can both decode the image and encode WebP. */
export function canCompress(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const source = await decode(file);
  if (!source) {
    return { file, width: 0, height: 0 };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height));
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return { file, width: source.width, height: source.height };
  }
  // JPEG sources have no alpha, and without this the transparent areas come out black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source.image, 0, 0, width, height);

  const blob = await encode(canvas);
  // Re-encoding can come out larger than the original for a small or already-optimised file.
  if (!blob || blob.size >= file.size) {
    return { file, width: source.width, height: source.height };
  }

  return {
    file: new File([blob], swapExtension(file.name), { type: "image/webp" }),
    width,
    height,
  };
}

interface DecodedImage {
  image: CanvasImageSource;
  width: number;
  height: number;
}

async function decode(file: File): Promise<DecodedImage | null> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return { image, width: image.naturalWidth, height: image.naturalHeight };
  } catch {
    // A file the browser cannot decode is the server's problem to report, not the user's.
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", WEBP_QUALITY);
  });
}

function swapExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "") + ".webp";
}
