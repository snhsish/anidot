import {
  createFlickerSequence,
  type AnimationConfig,
  type DotGrid,
  type DotShape,
  type ThresholdMode,
} from "@bitmapper/core";
import { renderGif, rasterizeFrame } from "@bitmapper/renderer-gif";
import { renderAnimatedSvg, renderStaticSvg } from "@bitmapper/renderer-svg";
import { buildEmbedSnippet } from "@bitmapper/renderer-canvas";
import { zipSync } from "fflate";

export interface RasterOpts {
  shape: DotShape;
  color: string;
  background: string;
  dotScale: number;
  transparent: boolean;
  gap: number;
}

export function download(filename: string, data: BlobPart, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ExportInputs {
  grid: DotGrid;
  animation: ReturnType<typeof createFlickerSequence>;
  raster: RasterOpts;
}

export function exportStaticSvg({ grid, raster }: Omit<ExportInputs, "animation">) {
  const svg = renderStaticSvg(grid, raster);
  download("bitmapper.svg", svg, "image/svg+xml");
}

export function exportAnimatedSvg({ grid, animation, raster }: ExportInputs) {
  const svg = renderAnimatedSvg(grid, animation, raster);
  download("bitmapper-animated.svg", svg, "image/svg+xml");
}

export function exportGif({ grid, animation, raster }: ExportInputs) {
  const bytes = renderGif(grid, animation, { ...raster, fps: animation.config.fps });
  download("bitmapper.gif", new Uint8Array(bytes), "image/gif");
}

/** Encode each frame to PNG and bundle into a single .zip download. */
export async function exportPngSequence(
  grid: DotGrid,
  animation: ReturnType<typeof createFlickerSequence>,
  raster: RasterOpts
) {
  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < animation.frames.length; i++) {
    const rgba = rasterizeFrame(grid, animation.frames[i].opacities, raster);
    const png = await rgbaToPng(rgba, grid.width, grid.height);
    files[`frame-${String(i).padStart(4, "0")}.png`] = new Uint8Array(png);
  }
  const zipped = zipSync(files, { level: 6 });
  download("bitmapper-frames.zip", new Uint8Array(zipped), "application/zip");
}

function rgbaToPng(rgba: Uint8ClampedArray, w: number, h: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const img = new ImageData(new Uint8ClampedArray(rgba), w, h);
    ctx.putImageData(img, 0, 0);
    canvas.toBlob((b) => {
      if (!b) return reject(new Error("PNG encode failed"));
      b.arrayBuffer().then(resolve);
    }, "image/png");
  });
}

/** Record the live canvas via MediaRecorder to produce a WebM. */
export function exportWebm(
  canvas: HTMLCanvasElement,
  fps: number,
  durationSec: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = canvas.captureStream(fps);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      download("bitmapper.webm", new Blob(chunks, { type: "video/webm" }), "video/webm");
      resolve();
    };
    rec.onerror = () => reject(new Error("WebM recording failed"));
    rec.start();
    setTimeout(() => rec.stop(), Math.round(durationSec * 1000));
  });
}

export function buildEmbed(
  grid: DotGrid,
  config: AnimationConfig,
  raster: RasterOpts
) {
  return buildEmbedSnippet(grid, config, raster);
}
