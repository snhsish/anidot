import {
  pixelBufferToGrid,
  type DotGrid,
  type GridOptions,
  type PixelBuffer,
} from "@bitmapper/core";

/** Largest dimension we decode to. The grid is a heavy downsample anyway, so
 *  keeping the working buffer modest avoids canvas-size limits and makes
 *  getImageData / grid computation fast. */
const MAX_SIDE = 2048;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = src;
  });
}

/** Decode a browser File/Blob into a runtime-agnostic PixelBuffer via canvas.
 *  Tries `createImageBitmap` first and falls back to an `<img>` decode, which is
 *  the most broadly supported path (and avoids silently producing an empty
 *  buffer that would render as a black screen). */
export async function fileToPixelBuffer(file: File | Blob): Promise<PixelBuffer> {
  let source: CanvasImageSource;
  let width: number;
  let height: number;
  let closeBitmap: (() => void) | null = null;

  try {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    source = bitmap;
    closeBitmap = () => bitmap.close?.();
  } catch {
    // Fallback for environments / formats where createImageBitmap fails.
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImageElement(url);
      width = img.naturalWidth;
      height = img.naturalHeight;
      source = img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (!width || !height) {
    closeBitmap?.();
    throw new Error("Could not determine image dimensions");
  }

  // Scale down to a sane working resolution.
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    closeBitmap?.();
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.drawImage(source, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  closeBitmap?.();

  // Guard against a fully transparent / empty decode.
  let anyPixel = false;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] || data[i + 1] || data[i + 2] || data[i + 3]) {
      anyPixel = true;
      break;
    }
  }
  if (!anyPixel) {
    throw new Error("Decoded image contained no pixel data");
  }

  return { data, width: w, height: h };
}

export function computeGrid(
  pixels: PixelBuffer,
  options: GridOptions
): DotGrid {
  return pixelBufferToGrid(pixels, options);
}
