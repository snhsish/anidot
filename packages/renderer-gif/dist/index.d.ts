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
/** Render one animation frame (opacities) to an RGBA buffer. */
export declare function rasterizeFrame(grid: DotGrid, opacities: ArrayLike<number>, options?: RasterOptions): Uint8ClampedArray;
/** Encode a full flicker animation as an animated GIF. */
export declare function renderGif(grid: DotGrid, animation: AnimationResult, options?: RasterOptions & {
    fps?: number;
}): Uint8Array;
//# sourceMappingURL=index.d.ts.map