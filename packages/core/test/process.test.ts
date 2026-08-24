import { describe, expect, it } from "vitest";
import { luminance, pixelBufferToGrid } from "../src/process.js";
import type { PixelBuffer } from "../src/types.js";

function makeBuffer(width: number, height: number, fill?: (x: number, y: number) => [number, number, number, number]): PixelBuffer {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fill ? fill(x, y) : [0, 0, 0, 255];
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return { data, width, height };
}

describe("luminance", () => {
  it("weights green most heavily (Rec 709)", () => {
    expect(luminance(0, 255, 0)).toBeGreaterThan(luminance(255, 0, 0));
    expect(luminance(0, 0, 0)).toBe(0);
    expect(luminance(255, 255, 255)).toBeCloseTo(255, 5);
  });
});

describe("pixelBufferToGrid", () => {
  it("marks bright cells on and dark cells off by default", () => {
    // 4x4 image, left half white, right half black. Grid 2x2 => left on, right off.
    const buf = makeBuffer(4, 4, (x) => (x < 2 ? [255, 255, 255, 255] : [0, 0, 0, 255]));
    const grid = pixelBufferToGrid(buf, { cols: 2, rows: 2, threshold: 0.5 });
    expect(grid.dots[0].on).toBe(true); // (0,0)
    expect(grid.dots[1].on).toBe(false); // (1,0)
    expect(grid.litIndices.length).toBe(2);
  });

  it("respects invert", () => {
    const buf = makeBuffer(4, 4, () => [255, 255, 255, 255]);
    const grid = pixelBufferToGrid(buf, { cols: 2, rows: 2, threshold: 0.5, invert: true });
    expect(grid.litIndices.length).toBe(0);
  });

  it("alpha mode uses alpha channel for silhouettes", () => {
    const buf = makeBuffer(4, 4, (x) => (x < 2 ? [255, 0, 0, 255] : [255, 0, 0, 0]));
    const grid = pixelBufferToGrid(buf, { cols: 2, rows: 2, threshold: 0.5, mode: "alpha" });
    expect(grid.dots[0].on).toBe(true);
    expect(grid.dots[1].on).toBe(false);
  });

  it("computes average brightness of a block", () => {
    const buf = makeBuffer(2, 2, () => [128, 128, 128, 255]);
    const grid = pixelBufferToGrid(buf, { cols: 1, rows: 1 });
    expect(grid.dots[0].brightness).toBeCloseTo(128 / 255, 2);
  });
});
