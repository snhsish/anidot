import gifencDefault, * as gifencNs from "gifenc";

// gifenc ships an ESM build (named exports) and a CJS build (only `default`
// is statically detectable by Node). Pick whichever actually has the API.
const gifApi: {
  GIFEncoder: (opts?: { auto?: boolean; initialCapacity?: number }) => {
    writeFrame: (index: Uint8Array | number[], w: number, h: number, o?: Record<string, unknown>) => void;
    finish: () => void;
    bytes: () => Uint8Array;
  };
  quantize: (rgba: Uint8Array | Uint8ClampedArray, max: number, o?: Record<string, unknown>) => number[][];
  applyPalette: (rgba: Uint8Array | Uint8ClampedArray, palette: number[][], f?: string) => Uint8Array;
} =
  gifencNs && (gifencNs as any).GIFEncoder && (gifencNs as any).quantize
    ? (gifencNs as any)
    : (gifencDefault as any);

const GIF = gifApi.GIFEncoder;
const quantize = gifApi.quantize;
const applyPalette = gifApi.applyPalette;

import { parseColor } from "@bitmapper/core";
import type { AnimationResult, DotGrid, DotShape } from "@bitmapper/core";

export interface RasterOptions {
  shape?: DotShape;
  color?: string;
  background?: string;
  dotScale?: number;
  /** Leave the background transparent (alpha 0). */
  transparent?: boolean;
  /** Spacing between dots as a fraction of the cell size (0..1). */
  gap?: number;
}

const DEFAULTS: Required<RasterOptions> = {
  shape: "circle",
  color: "#FF5A1F",
  background: "#FFFFFF",
  dotScale: 0.85,
  transparent: false,
  gap: 0,
};

function drawShape(
  buf: Uint8ClampedArray,
  w: number,
  h: number,
  cx: number,
  cy: number,
  radius: number,
  shape: DotShape,
  cr: number,
  cg: number,
  cb: number,
  opacity: number
) {
  const r = Math.max(0, radius);
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(h - 1, Math.ceil(cy + r));
  const r2 = r * r;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let mask: number;
      if (shape === "circle") {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        // Soft edge for anti-aliasing.
        const edge = r - Math.sqrt(d2);
        mask = edge >= 1 ? 1 : edge;
      } else {
        mask = 1;
      }
      const a = opacity * mask;
      if (a <= 0) continue;
      const i = (y * w + x) * 4;
      buf[i] = buf[i] * (1 - a) + cr * a;
      buf[i + 1] = buf[i + 1] * (1 - a) + cg * a;
      buf[i + 2] = buf[i + 2] * (1 - a) + cb * a;
      buf[i + 3] = 255;
    }
  }
}

/** Render one animation frame (opacities) to an RGBA buffer. */
export function rasterizeFrame(
  grid: DotGrid,
  opacities: ArrayLike<number>,
  options: RasterOptions = {}
): Uint8ClampedArray {
  const opts = { ...DEFAULTS, ...options };
  const w = grid.width;
  const h = grid.height;
  const buf = new Uint8ClampedArray(w * h * 4);
  const [br, bg, bb] = parseColor(opts.background);
  for (let i = 0; i < w * h; i++) {
    buf[i * 4] = br;
    buf[i * 4 + 1] = bg;
    buf[i * 4 + 2] = bb;
    buf[i * 4 + 3] = opts.transparent ? 0 : 255;
  }
  const [cr, cg, cb] = parseColor(opts.color);
  const cs = grid.cellSize;
  const radius = (cs / 2) * opts.dotScale / (1 + opts.gap);
  for (const idx of grid.litIndices) {
    const dot = grid.dots[idx];
    const o = dot.intensity * opacities[idx];
    if (o <= 0.001) continue;
    drawShape(
      buf,
      w,
      h,
      dot.col * cs + cs / 2,
      dot.row * cs + cs / 2,
      radius,
      opts.shape,
      cr,
      cg,
      cb,
      o
    );
  }
  return buf;
}

/** Encode a full flicker animation as an animated GIF. */
export function renderGif(
  grid: DotGrid,
  animation: AnimationResult,
  options: RasterOptions & { fps?: number } = {}
): Uint8Array {
  const opts = { ...DEFAULTS, ...options };
  const fps = options.fps ?? animation.config.fps;
  const delay = Math.max(1, Math.round(1000 / fps));
  const w = grid.width;
  const h = grid.height;
  const gif = GIF();
  for (const frame of animation.frames) {
    const rgba = rasterizeFrame(grid, frame.opacities, opts);
    const palette = quantize(rgba, 256, { format: "rgba4444" });
    const index = applyPalette(rgba, palette, "rgba4444");
    gif.writeFrame(index, w, h, { palette, delay });
  }
  gif.finish();
  return gif.bytes();
}
