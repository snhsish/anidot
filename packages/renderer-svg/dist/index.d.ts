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
export declare function renderStaticSvg(grid: DotGrid, options?: SvgOptions): string;
/**
 * Animated, self-contained SVG using SMIL `<animate>` per dot.
 * No JS dependency — pastes anywhere. Loops indefinitely.
 */
export declare function renderAnimatedSvg(grid: DotGrid, animation: AnimationResult, options?: SvgOptions): string;
/** Convenience: rasterize a single frame's opacities to a flat array (used by tests). */
export declare function frameOpacities(animation: AnimationResult, dotIndex: number): number[];
//# sourceMappingURL=index.d.ts.map