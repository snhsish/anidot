import type { AnimationResult, DotGrid, DotShape } from "@bitmapper/core";

export interface SvgOptions {
  shape?: DotShape;
  color?: string;
  /** CSS background color or "transparent". */
  background?: string;
  /** Fraction of the cell the dot occupies (0..1). */
  dotScale?: number;
  /** Outer padding in output pixels. */
  padding?: number;
  /** Leave the background transparent (overrides `background`). */
  transparent?: boolean;
  /** Spacing between dots as a fraction of the cell size (0..1). */
  gap?: number;
}

const DEFAULTS: Required<SvgOptions> = {
  shape: "circle",
  color: "#FF5A1F",
  background: "transparent",
  dotScale: 0.85,
  padding: 0,
  transparent: false,
  gap: 0,
};

interface Placed {
  cx: number;
  cy: number;
  half: number;
  intensity: number;
}

function placed(grid: DotGrid, opts: Required<SvgOptions>): Placed[] {
  const pad = opts.padding;
  const cs = grid.cellSize;
  const r = (cs / 2) * opts.dotScale / (1 + opts.gap);
  const out: Placed[] = [];
  for (const idx of grid.litIndices) {
    const dot = grid.dots[idx];
    out.push({
      cx: pad + dot.col * cs + cs / 2,
      cy: pad + dot.row * cs + cs / 2,
      half: r,
      intensity: dot.intensity,
    });
  }
  return out;
}

function shapeEl(p: Placed, shape: DotShape, fill: string, opacity?: number): string {
  const op = opacity === undefined ? "" : ` opacity="${opacity}"`;
  if (shape === "circle") {
    return `<circle cx="${p.cx.toFixed(2)}" cy="${p.cy.toFixed(2)}" r="${p.half.toFixed(2)}" fill="${fill}"${op} />`;
  }
  const s = p.half * 2;
  return `<rect x="${(p.cx - p.half).toFixed(2)}" y="${(p.cy - p.half).toFixed(2)}" width="${s.toFixed(2)}" height="${s.toFixed(2)}" rx="${(s * 0.12).toFixed(2)}" fill="${fill}"${op} />`;
}

export function renderStaticSvg(grid: DotGrid, options: SvgOptions = {}): string {
  const opts = { ...DEFAULTS, ...options };
  const w = grid.width + opts.padding * 2;
  const h = grid.height + opts.padding * 2;
  const bg =
    opts.transparent || opts.background === "transparent"
      ? ""
      : `\n  <rect width="${w}" height="${h}" fill="${opts.background}" />`;
  const shapes = placed(grid, opts)
    .map((p) => "  " + shapeEl(p, opts.shape, opts.color, p.intensity))
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">${bg}\n${shapes}\n</svg>\n`;
}

/**
 * Animated, self-contained SVG using SMIL `<animate>` per dot.
 * No JS dependency — pastes anywhere. Loops indefinitely.
 */
export function renderAnimatedSvg(grid: DotGrid, animation: AnimationResult, options: SvgOptions = {}): string {
  const opts = { ...DEFAULTS, ...options };
  const w = grid.width + opts.padding * 2;
  const h = grid.height + opts.padding * 2;
  const bg =
    opts.transparent || opts.background === "transparent"
      ? ""
      : `\n  <rect width="${w}" height="${h}" fill="${opts.background}" />`;
  const dur = animation.duration.toFixed(3);

  const n = animation.frames.length;
  const keyTimes = Array.from({ length: n }, (_, i) => (n === 1 ? 0 : i / (n - 1))).join(";");

  const placedDots = placed(grid, opts);
  const frag: string[] = [];
  for (let k = 0; k < placedDots.length; k++) {
    const idx = grid.litIndices[k];
    const intensity = placedDots[k].intensity;
    const values = animation.frames
      .map((f) => (intensity * f.opacities[idx]).toFixed(3))
      .join(";");
    const el = shapeEl(placedDots[k], opts.shape, opts.color);
    // Inject an <animate> before the closing /> of the shape.
    const animated = el.replace(
      " />",
      `>\n    <animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" dur="${dur}s" repeatCount="indefinite" calcMode="linear" />\n  </${opts.shape}>`
    );
    frag.push("  " + animated);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="geometricPrecision">${bg}\n${frag.join("\n")}\n</svg>\n`;
}

/** Convenience: rasterize a single frame's opacities to a flat array (used by tests). */
export function frameOpacities(animation: AnimationResult, dotIndex: number): number[] {
  return animation.frames.map((f) => f.opacities[dotIndex]);
}
