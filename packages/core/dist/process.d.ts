import type { DotGrid, GridOptions, PixelBuffer } from "./types.js";
/** Relative luminance of an RGB triple, 0..255. */
export declare function luminance(r: number, g: number, b: number): number;
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
export declare function computeIntensity(lum: number, alpha: number, mode: GridOptions["mode"], threshold: number, invert: boolean): number;
/**
 * Convert a raw RGBA pixel buffer into a dot grid.
 * Runtime-agnostic: works with `sharp` output (Node) or `getImageData` (browser).
 */
export declare function pixelBufferToGrid(pixels: PixelBuffer, options: GridOptions): DotGrid;
//# sourceMappingURL=process.d.ts.map