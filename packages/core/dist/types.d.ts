/** A raw RGBA pixel buffer, implementable by `sharp` (Node) or canvas (browser). */
export interface PixelBuffer {
    /** Flat RGBA bytes, length === width * height * 4. */
    data: Uint8Array | Uint8ClampedArray;
    width: number;
    height: number;
}
/** How a dot is considered "on". */
export type ThresholdMode = "brightness" | "alpha";
export type DotShape = "square" | "circle";
export interface GridOptions {
    /** Number of dot columns. */
    cols: number;
    /** Number of dot rows. */
    rows: number;
    /** Luminance/alpha value (0..1) above which a dot is "on". */
    threshold?: number;
    /** Thresholding mode. */
    mode?: ThresholdMode;
    /** Invert light/dark (or the on/off decision for alpha mode). */
    invert?: boolean;
    /** Auto-pick an inversion based on the image's mean brightness so the
     *  subject emerges as dots regardless of lighting. Default true. */
    autoInvert?: boolean;
    /** Output size of each cell in pixels (default 10). Renderers may scale further. */
    cellSize?: number;
    /** Extra spacing between dots as a fraction of the cell size (0..1). */
    gap?: number;
    /** Optional precomputed dot color, stored for convenience. */
    color?: string;
}
/** One cell of the dot grid. */
export interface DotState {
    col: number;
    row: number;
    /** Whether the dot is rendered at all (intensity > 0). */
    on: boolean;
    /** Normalized luminance/alpha of the cell, 0..1. */
    brightness: number;
    /** Render intensity 0..1 (controls dot opacity/size). 0 = not drawn. */
    intensity: number;
}
export interface DotGrid {
    cols: number;
    rows: number;
    /** Output pixel width of the rendered image. */
    width: number;
    /** Output pixel height of the rendered image. */
    height: number;
    /** Cell size in output pixels. */
    cellSize: number;
    /** Indexable by `row * cols + col`. */
    dots: DotState[];
    /** Indices (into `dots`) of dots with intensity > 0 (i.e. drawn). */
    litIndices: number[];
}
export interface AnimationConfig {
    /** Fraction of on-dots that may start flickering per tick (0..1). */
    flickerRate: number;
    /** Frames per second of the animation. */
    fps: number;
    /** Total duration in seconds. */
    duration: number;
    /** Seed for reproducible randomness. */
    seed: number;
    /** How many consecutive frames a dimmed dot stays dim (organic feel). */
    maxDimFrames?: number;
    /** Floor opacity a flickering dot drops to (0..1). */
    minOpacity?: number;
    /** Temporal smoothing toward target opacity (0..1, higher = snappier). */
    smoothing?: number;
    /** Only flicker dots on the boundary of the lit region; interior stays static. */
    edgeOnlyFlicker?: boolean;
}
/** One animation frame: opacity per dot (off dots are 0). */
export interface Frame {
    /** Length === grid.dots.length. Opacity 0..1. */
    opacities: ArrayLike<number>;
}
export interface AnimationResult {
    frames: Frame[];
    config: AnimationConfig;
    /** Total loop duration in seconds. */
    duration: number;
}
//# sourceMappingURL=types.d.ts.map