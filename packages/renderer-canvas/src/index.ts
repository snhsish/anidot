import { createFlickerState, flickerStep } from "@bitmapper/core";
import type { AnimationConfig, DotGrid, DotShape } from "@bitmapper/core";

export interface LiveOptions {
  shape?: DotShape;
  color?: string;
  background?: string;
  dotScale?: number;
  /** Leave the canvas background transparent (no fill). */
  transparent?: boolean;
  /** Spacing between dots as a fraction of the cell size (0..1). */
  gap?: number;
  /** Called on each drawn frame for scrubbers/UI. */
  onFrame?: (frameIndex: number) => void;
}

const DEFAULTS: Required<Omit<LiveOptions, "onFrame">> = {
  shape: "circle",
  color: "#FF5A1F",
  background: "#FFFFFF",
  dotScale: 0.85,
  transparent: false,
  gap: 0,
};

/**
 * Live, randomized flicker renderer on a 2D canvas. Runs indefinitely using
 * requestAnimationFrame and steps the deterministic flicker engine at `fps`.
 */
export class LiveDotMatrix {
  private ctx: CanvasRenderingContext2D;
  private grid: DotGrid;
  private config: AnimationConfig;
  private opts: Required<Omit<LiveOptions, "onFrame">> & Pick<LiveOptions, "onFrame">;
  private state: ReturnType<typeof createFlickerState>;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private frameIndex = 0;
  private running = false;

  constructor(
    canvas: HTMLCanvasElement,
    grid: DotGrid,
    config: AnimationConfig,
    options: LiveOptions = {}
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.grid = grid;
    this.config = config;
    this.opts = { ...DEFAULTS, ...options };
    this.state = createFlickerState(this.grid, this.config);
    this.resize();
    for (const idx of this.state.onIndices) this.state.opacity[idx] = 1;
  }

  setGrid(grid: DotGrid) {
    this.grid = grid;
    this.state = createFlickerState(this.grid, this.config);
    for (const idx of this.state.onIndices) this.state.opacity[idx] = 1;
    this.resize();
  }

  setConfig(config: AnimationConfig) {
    this.config = config;
    this.state.config = { ...this.state.config, ...config };
  }

  setOptions(options: LiveOptions) {
    this.opts = { ...this.opts, ...options };
    this.resize();
  }

  resize() {
    const { width, height } = this.grid;
    if (this.ctx.canvas.width !== width) this.ctx.canvas.width = width;
    if (this.ctx.canvas.height !== height) this.ctx.canvas.height = height;
  }

  private draw(opacity: Float32Array) {
    const { ctx, grid, opts } = this;
    const cs = grid.cellSize;
    if (opts.transparent) {
      ctx.clearRect(0, 0, grid.width, grid.height);
    } else {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, grid.width, grid.height);
    }
    ctx.fillStyle = opts.color;
    const r = (cs / 2) * opts.dotScale / (1 + opts.gap);
    for (const idx of grid.litIndices) {
      const o = grid.dots[idx].intensity * opacity[idx];
      if (o <= 0.001) continue;
      const dot = grid.dots[idx];
      const cx = dot.col * cs + cs / 2;
      const cy = dot.row * cs + cs / 2;
      ctx.globalAlpha = o;
      if (opts.shape === "circle") {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const s = r * 2;
        ctx.beginPath();
        this.roundRect(cx - r, cy - r, s, s, s * 0.12);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private roundRect(x: number, y: number, w: number, h: number, radius: number) {
    const ctx = this.ctx;
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    if (!this.last) this.last = now;
    const dt = (now - this.last) / 1000;
    this.last = now;
    this.acc += dt;
    const step = 1 / this.config.fps;
    let drew = false;
    while (this.acc >= step) {
      this.acc -= step;
      flickerStep(this.state);
      this.frameIndex++;
      drew = true;
    }
    if (drew || this.frameIndex === 0) this.draw(this.state.opacity);
    this.opts.onFrame?.(this.frameIndex);
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  get isRunning() {
    return this.running;
  }
}

/** Generate a drop-in <script> widget snippet that renders the live animation. */
export function buildEmbedSnippet(grid: DotGrid, config: AnimationConfig, options: LiveOptions = {}): string {
  const data = {
    grid,
    config,
    options: { ...DEFAULTS, ...options },
  };
  return `<!-- Bitmapper live dot-matrix widget -->
<div id="bitmapper-widget" style="display:inline-block"></div>
<script type="module">
const __BITMAPPER_DATA__ = ${JSON.stringify(data)};
const s = document.createElement('script');
s.src = 'https://unpkg.com/@bitmapper/renderer-canvas/dist/widget.js';
s.onload = () => window.Bitmapper.mount('bitmapper-widget', __BITMAPPER_DATA__);
document.head.appendChild(s);
</script>`;
}
