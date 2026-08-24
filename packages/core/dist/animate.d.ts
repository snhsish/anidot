import { Rng } from "./rng.js";
import type { AnimationConfig, AnimationResult, DotGrid } from "./types.js";
export interface FlickerState {
    /** Current opacity per dot (length === grid.dots.length). */
    opacity: Float32Array;
    /** Frames remaining dimmed, per on-dot. */
    cooldown: Int32Array;
    /** Target dim opacity per on-dot when active. */
    dimOpacity: Float32Array;
    rng: Rng;
    config: Required<AnimationConfig>;
    onIndices: number[];
    /** Per-dot flag: 1 if the dot borders an unlit cell (a flicker "edge"). */
    edge: Uint8Array;
}
/** Build a fresh flicker engine for a grid. */
export declare function createFlickerState(grid: DotGrid, config: AnimationConfig): FlickerState;
/** Advance the engine by one frame, mutating and returning opacities. */
export declare function flickerStep(state: FlickerState): Float32Array;
/**
 * Generate a deterministic flicker animation sequence.
 * The first frame starts fully "on"; subsequent frames flicker organically.
 */
export declare function createFlickerSequence(grid: DotGrid, config: AnimationConfig): AnimationResult;
//# sourceMappingURL=animate.d.ts.map