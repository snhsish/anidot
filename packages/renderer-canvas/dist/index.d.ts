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
/**
 * Live, randomized flicker renderer on a 2D canvas. Runs indefinitely using
 * requestAnimationFrame and steps the deterministic flicker engine at `fps`.
 */
export declare class LiveDotMatrix {
    private ctx;
    private grid;
    private config;
    private opts;
    private state;
    private raf;
    private last;
    private acc;
    private frameIndex;
    private running;
    constructor(canvas: HTMLCanvasElement, grid: DotGrid, config: AnimationConfig, options?: LiveOptions);
    setGrid(grid: DotGrid): void;
    setConfig(config: AnimationConfig): void;
    setOptions(options: LiveOptions): void;
    resize(): void;
    private draw;
    private roundRect;
    private tick;
    start(): void;
    stop(): void;
    get isRunning(): boolean;
}
/** Generate a drop-in <script> widget snippet that renders the live animation. */
export declare function buildEmbedSnippet(grid: DotGrid, config: AnimationConfig, options?: LiveOptions): string;
//# sourceMappingURL=index.d.ts.map