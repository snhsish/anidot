import { makeRng, Rng } from "./rng.js";
import type { AnimationConfig, AnimationResult, DotGrid, Frame } from "./types.js";

const DEFAULTS = {
  maxDimFrames: 6,
  minOpacity: 0.12,
  smoothing: 0.35,
  edgeOnlyFlicker: false,
} as const;

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

/** True when a lit dot sits next to an unlit neighbor (the lit-region boundary). */
function computeEdge(grid: DotGrid): Uint8Array {
  const { cols, rows, dots } = grid;
  const onArr = new Uint8Array(dots.length);
  for (const d of dots) if (d.on) onArr[d.row * cols + d.col] = 1;
  const edge = new Uint8Array(dots.length);
  for (const d of dots) {
    if (!d.on) continue;
    const { col, row } = d;
    const neighbors = [
      col > 0 ? onArr[row * cols + (col - 1)] : 1,
      col < cols - 1 ? onArr[row * cols + (col + 1)] : 1,
      row > 0 ? onArr[(row - 1) * cols + col] : 1,
      row < rows - 1 ? onArr[(row + 1) * cols + col] : 1,
    ];
    if (neighbors.some((n) => n === 0)) edge[row * cols + col] = 1;
  }
  return edge;
}

/** Build a fresh flicker engine for a grid. */
export function createFlickerState(grid: DotGrid, config: AnimationConfig): FlickerState {
  const full = { ...DEFAULTS, ...config } as Required<AnimationConfig>;
  return {
    opacity: new Float32Array(grid.dots.length),
    cooldown: new Int32Array(grid.dots.length),
    dimOpacity: new Float32Array(grid.dots.length),
    rng: makeRng(config.seed),
    config: full,
    onIndices: grid.litIndices,
    edge: computeEdge(grid),
  };
}

/** Advance the engine by one frame, mutating and returning opacities. */
export function flickerStep(state: FlickerState): Float32Array {
  const { opacity, cooldown, dimOpacity, rng, config, onIndices, edge } = state;
  for (const idx of onIndices) {
    // Interior dots stay fully lit when edge-only flicker is enabled.
    if (config.edgeOnlyFlicker && edge[idx] === 0) {
      opacity[idx] = 1;
      continue;
    }
    let target: number;
    if (cooldown[idx] > 0) {
      cooldown[idx]--;
      target = dimOpacity[idx];
    } else if (rng.next() < config.flickerRate) {
      dimOpacity[idx] = rng.range(config.minOpacity, 0.6);
      cooldown[idx] = rng.int(1, config.maxDimFrames);
      target = dimOpacity[idx];
    } else {
      target = 1;
    }
    opacity[idx] += (target - opacity[idx]) * config.smoothing;
    if (opacity[idx] < 0.001) opacity[idx] = 0;
  }
  return opacity;
}

/**
 * Generate a deterministic flicker animation sequence.
 * The first frame starts fully "on"; subsequent frames flicker organically.
 */
export function createFlickerSequence(grid: DotGrid, config: AnimationConfig): AnimationResult {
  const full: Required<AnimationConfig> = { ...DEFAULTS, ...config } as Required<AnimationConfig>;
  const frameCount = Math.max(1, Math.round(full.fps * full.duration));
  const state = createFlickerState(grid, full);
  // Start fully on.
  for (const idx of state.onIndices) state.opacity[idx] = 1;

  const frames: Frame[] = [];
  for (let f = 0; f < frameCount; f++) {
    if (f > 0) flickerStep(state);
    frames.push({ opacities: Float32Array.from(state.opacity) });
  }
  return { frames, config: full, duration: full.duration };
}
