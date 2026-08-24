import { describe, expect, it } from "vitest";
import { pixelBufferToGrid } from "@bitmapper/core";
import { renderGif, rasterizeFrame } from "../src/index.js";

function whiteGrid(cols = 8, rows = 8) {
  const data = new Uint8Array(cols * rows * 4).fill(255);
  return pixelBufferToGrid({ data, width: cols, height: rows }, { cols, rows, autoInvert: false });
}

describe("renderer-gif", () => {
  it("rasterizeFrame returns an RGBA buffer of correct size", () => {
    const grid = whiteGrid();
    const buf = rasterizeFrame(grid, grid.dots.map((d) => (d.on ? 1 : 0)), { color: "#FF0000" });
    expect(buf.length).toBe(grid.width * grid.height * 4);
  });

  it("renderGif produces a valid GIF89a file", () => {
    const grid = whiteGrid();
    const anim = {
      frames: [{ opacities: grid.dots.map(() => 1) }, { opacities: grid.dots.map(() => 0.5) }],
      config: { flickerRate: 0.2, fps: 10, duration: 1, seed: 1 },
      duration: 1,
    } as any;
    const bytes = renderGif(grid, anim, { color: "#FF0000" });
    const header = String.fromCharCode(...bytes.slice(0, 6));
    expect(header).toBe("GIF89a");
  });
});
