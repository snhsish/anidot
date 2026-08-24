import { describe, expect, it } from "vitest";
import { makeRng, Rng } from "../src/rng.js";
import { createFlickerSequence, createFlickerState, flickerStep } from "../src/animate.js";
import { pixelBufferToGrid } from "../src/process.js";
import type { PixelBuffer } from "../src/types.js";

function onGrid(cols = 20, rows = 20): ReturnType<typeof pixelBufferToGrid> {
  const data = new Uint8Array(cols * rows * 4);
  for (let i = 0; i < cols * rows; i++) {
    data[i * 4] = 200;
    data[i * 4 + 1] = 200;
    data[i * 4 + 2] = 200;
    data[i * 4 + 3] = 255;
  }
  const buf: PixelBuffer = { data, width: cols, height: rows };
  return pixelBufferToGrid(buf, { cols, rows });
}

describe("Rng", () => {
  it("is deterministic for a given seed", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("differs across seeds", () => {
    const a = new Rng(1);
    const b = new Rng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it("produces values in [0,1)", () => {
    const r = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("createFlickerSequence", () => {
  it("is reproducible for a given seed", () => {
    const grid = onGrid();
    const cfg = { flickerRate: 0.2, fps: 12, duration: 1, seed: 123 };
    const a = createFlickerSequence(grid, cfg);
    const b = createFlickerSequence(grid, cfg);
    expect(a.frames).toEqual(b.frames);
  });

  it("first frame is fully on, later frames flicker some dots down", () => {
    const grid = onGrid(40, 40);
    const { frames } = createFlickerSequence(grid, { flickerRate: 0.3, fps: 10, duration: 2, seed: 5 });
    expect(frames.length).toBe(20);
    // First frame: every on-dot is fully lit.
    const onMin = Math.min(...grid.litIndices.map((i) => frames[0].opacities[i]));
    expect(onMin).toBe(1);
    // Some later frame should have a dimmed dot.
    const dimmed = frames.slice(1).some((f) => f.opacities.some((o) => o < 0.95));
    expect(dimmed).toBe(true);
  });

  it("off dots stay at opacity 0", () => {
    const grid = onGrid();
    const { frames } = createFlickerSequence(grid, { flickerRate: 0.5, fps: 5, duration: 1, seed: 9 });
    for (const f of frames) {
      for (let i = 0; i < grid.dots.length; i++) {
        if (!grid.dots[i].on) expect(f.opacities[i]).toBe(0);
      }
    }
  });
});

describe("flickerStep (streaming)", () => {
  it("advances state and stays within [0,1]", () => {
    const grid = onGrid(10, 10);
    const state = createFlickerState(grid, { flickerRate: 0.3, fps: 12, duration: 1, seed: 3 });
    for (const idx of state.onIndices) state.opacity[idx] = 1;
    for (let i = 0; i < 30; i++) {
      const o = flickerStep(state);
      for (const v of o) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
