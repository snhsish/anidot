import type { DotGrid, DotState, GridOptions, PixelBuffer } from "./types.js";

const REC_709 = [0.2126, 0.7152, 0.0722] as const;

/** Relative luminance of an RGB triple, 0..255. */
export function luminance(r: number, g: number, b: number): number {
  return REC_709[0] * r + REC_709[1] * g + REC_709[2] * b;
}

function average(data: Uint8Array | Uint8ClampedArray, x0: number, y0: number, x1: number, y1: number, width: number) {
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  let n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const idx = (y * width + x) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      a += data[idx + 3];
      n++;
    }
  }
  if (n === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return { r: r / n, g: g / n, b: b / n, a: a / n };
}

/**
 * Compute a dot's render intensity from a cell's luminance/alpha.
 *
 * - `brightness` mode: intensity follows the cell's luminance (a true LED /
 *   halftone dot-matrix — the picture is reproduced as dots of varying
 *   brightness). `threshold` acts as a black-point: values at or below it are
 *   dropped, values above are scaled up. `invert` flips light/dark.
 * - `alpha` mode: a hard silhouette — a dot is on only if the alpha channel
 *   passes the threshold (for logos / cutouts). Intensity is then 1 or 0.
 */
export function computeIntensity(
  lum: number,
  alpha: number,
  mode: GridOptions["mode"],
  threshold: number,
  invert: boolean
): number {
  if (mode === "alpha") {
    const a = alpha / 255;
    const pass = invert ? a <= threshold : a > threshold;
    return pass ? 1 : 0;
  }
  let v = lum / 255;
  if (invert) v = 1 - v;
  if (threshold > 0) {
    v = (v - threshold) / (1 - threshold);
  }
  if (v < 0) v = 0;
  else if (v > 1) v = 1;
  return v;
}

/**
 * Convert a raw RGBA pixel buffer into a dot grid.
 * Runtime-agnostic: works with `sharp` output (Node) or `getImageData` (browser).
 */
export function pixelBufferToGrid(pixels: PixelBuffer, options: GridOptions): DotGrid {
  const { data, width, height } = pixels;
  const cols = Math.max(1, Math.floor(options.cols));
  const rows = Math.max(1, Math.floor(options.rows));
  const mode: GridOptions["mode"] = options.mode ?? "brightness";
  const threshold = options.threshold ?? (mode === "alpha" ? 0.5 : 0);
  const forceInvert = options.invert ?? false;
  const autoInvert = options.autoInvert ?? true;
  const baseCell = Math.max(1, options.cellSize ?? 10);
  // `gap` widens the pitch between dot centers (spacing) without shrinking
  // the dots themselves — dot size is governed by `dotScale` at render time.
  const gap = Math.max(0, options.gap ?? 0);
  const cellSize = Math.round(baseCell * (1 + gap));

  const blockW = Math.max(1, Math.floor(width / cols));
  const blockH = Math.max(1, Math.floor(height / rows));

  const dots: DotState[] = new Array(cols * rows);
  const litIndices: number[] = [];
  const alphas = new Float32Array(cols * rows);

  for (let row = 0; row < rows; row++) {
    const y0 = row * blockH;
    const y1 = Math.min(height, (row + 1) * blockH);
    for (let col = 0; col < cols; col++) {
      const x0 = col * blockW;
      const x1 = Math.min(width, (col + 1) * blockW);
      const avg = average(data, x0, y0, x1, y1, width);
      const lum = luminance(avg.r, avg.g, avg.b);
      const idx = row * cols + col;
      dots[idx] = { col, row, on: false, brightness: lum / 255, intensity: 0 };
      alphas[idx] = avg.a / 255;
    }
  }

  // Decide inversion from the image's mean luminance so bright photos
  // (subject on light background) still emerge as a dot pattern.
  let sum = 0;
  for (const d of dots) sum += d.brightness;
  const mean = sum / dots.length;
  const invert = forceInvert || (autoInvert && mean > 0.5);

  for (let i = 0; i < dots.length; i++) {
    const d = dots[i];
    const intensity = computeIntensity(d.brightness * 255, alphas[i] * 255, mode, threshold, invert);
    d.intensity = intensity;
    d.on = intensity > 0;
    if (intensity > 0) litIndices.push(i);
  }

  return {
    cols,
    rows,
    width: cols * cellSize,
    height: rows * cellSize,
    cellSize,
    dots,
    litIndices,
  };
}
