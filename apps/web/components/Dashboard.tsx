"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageIcon, Play, Pause, Download, Code2, Upload } from "lucide-react";
import {
  createFlickerSequence,
  type AnimationConfig,
  type DotGrid,
  type DotShape,
  type PixelBuffer,
  type ThresholdMode,
} from "@bitmapper/core";
import { LiveDotMatrix } from "@bitmapper/renderer-canvas";
import { rasterizeFrame } from "@bitmapper/renderer-gif";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeGrid, fileToPixelBuffer } from "@/lib/image";
import {
  buildEmbed,
  exportAnimatedSvg,
  exportGif,
  exportPngSequence,
  exportStaticSvg,
  exportWebm,
} from "@/lib/export";

interface Params {
  gridW: number;
  gridH: number;
  shape: DotShape;
  color: string;
  threshold: number;
  mode: ThresholdMode;
  invert: boolean;
  autoInvert: boolean;
  flickerRate: number;
  fps: number;
  duration: number;
  seed: number;
  background: string;
  transparent: boolean;
  dotScale: number;
  gap: number;
  edgeOnlyFlicker: boolean;
}

const INITIAL: Params = {
  gridW: 100,
  gridH: 120,
  shape: "circle",
  color: "#FFFFFF",
  threshold: 0,
  mode: "brightness",
  invert: false,
  autoInvert: true,
  flickerRate: 0.15,
  fps: 12,
  duration: 4,
  seed: 1,
  background: "#0A0A0A",
  transparent: false,
  dotScale: 0.85,
  gap: 0,
  edgeOnlyFlicker: false,
};

function drawStaticFrame(
  canvas: HTMLCanvasElement,
  grid: DotGrid,
  opacities: ArrayLike<number> | null,
  raster: { shape: DotShape; color: string; background: string; dotScale: number }
) {
  canvas.width = grid.width;
  canvas.height = grid.height;
  const rgba = rasterizeFrame(
    grid,
    opacities ?? grid.dots.map((d) => (d.on ? 1 : 0)),
    raster
  );
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), grid.width, grid.height), 0, 0);
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <div className="flex flex-1 items-center justify-end gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
            }}
            className="w-full rounded-md border border-input bg-black/30 px-2 py-1 text-right font-mono text-xs tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {suffix && <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>}
        </div>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

export default function Dashboard() {
  const [params, setParams] = useState<Params>(INITIAL);
  const [file, setFile] = useState<File | null>(null);
  const [pixels, setPixels] = useState<PixelBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [grid, setGrid] = useState<DotGrid | null>(null);
  const [playing, setPlaying] = useState(true);
  const [scrub, setScrub] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [embed, setEmbed] = useState("");
  const [exportKind, setExportKind] = useState<"svg" | "animated-svg" | "gif" | "png" | "webm">("gif");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveRef = useRef<LiveDotMatrix | null>(null);

  const set = <K extends keyof Params>(key: K, value: Params[K]) =>
    setParams((p) => ({ ...p, [key]: value }));

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (files) => files[0] && setFile(files[0]),
  });

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setError(null);
    fileToPixelBuffer(file)
      .then((pb) => {
        if (cancelled) return;
        setPixels(pb);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("Image decode failed:", e);
        setPixels(null);
        setError(e instanceof Error ? e.message : "Could not decode image");
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!pixels) {
      setGrid(null);
      return;
    }
    const t = setTimeout(() => {
      const cell = Math.max(2, Math.min(12, Math.round(720 / params.gridW)));
      const g = computeGrid(pixels, {
        cols: params.gridW,
        rows: params.gridH,
        threshold: params.threshold,
        mode: params.mode,
        invert: params.invert,
        autoInvert: params.autoInvert,
        cellSize: cell,
        gap: params.gap,
      });
      setGrid(g);
    }, 120);
    return () => clearTimeout(t);
  }, [pixels, params.gridW, params.gridH, params.threshold, params.mode, params.invert, params.autoInvert]);

  const animConfig = useMemo<AnimationConfig>(
    () => ({
      flickerRate: params.flickerRate,
      fps: params.fps,
      duration: params.duration,
      seed: params.seed,
      edgeOnlyFlicker: params.edgeOnlyFlicker,
    }),
    [params.flickerRate, params.fps, params.duration, params.seed, params.edgeOnlyFlicker]
  );

  const raster = useMemo(
    () => ({
      shape: params.shape,
      color: params.color,
      background: params.transparent ? "transparent" : params.background,
      dotScale: params.dotScale,
      transparent: params.transparent,
      gap: params.gap,
    }),
    [params.shape, params.color, params.background, params.transparent, params.dotScale, params.gap]
  );

  const sequence = useMemo(
    () => (grid ? createFlickerSequence(grid, animConfig) : null),
    [grid, animConfig]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;
    if (playing) {
      liveRef.current?.stop();
      const live = new LiveDotMatrix(canvas, grid, animConfig, raster);
      live.start();
      liveRef.current = live;
      return () => live.stop();
    }
    liveRef.current?.stop();
    liveRef.current = null;
    drawStaticFrame(
      canvas,
      grid,
      sequence ? sequence.frames[scrub % sequence.frames.length].opacities : null,
      raster
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, playing, animConfig, raster, scrub, sequence]);

  const doExport = async (kind: "svg" | "animated-svg" | "gif" | "png" | "webm") => {
    if (!grid || !sequence) return;
    setBusy(kind);
    try {
      if (kind === "svg") exportStaticSvg({ grid, raster });
      else if (kind === "animated-svg") exportAnimatedSvg({ grid, animation: sequence, raster });
      else if (kind === "gif") exportGif({ grid, animation: sequence, raster });
      else if (kind === "png") await exportPngSequence(grid, sequence, raster);
      else if (kind === "webm" && canvasRef.current) await exportWebm(canvasRef.current, params.fps, params.duration);
    } finally {
      setBusy(null);
    }
  };

  const refreshEmbed = () => {
    if (!grid || !sequence) return;
    setEmbed(buildEmbed(grid, animConfig, raster));
  };

  const frameCount = sequence?.frames.length ?? 0;

  return (
    <div className="flex min-h-screen flex-col p-4 sm:p-6">
      <main className="mx-auto grid w-full max-w-[1800px] flex-1 items-start gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-[minmax(340px,22vw)_minmax(0,1fr)_minmax(340px,22vw)]">
        <Card className="lg:col-span-1 xl:col-span-1">
          <CardHeader>
            <div>
              <h1 className="text-lg font-semibold leading-none">AniDot</h1>
              <p className="text-xs text-muted-foreground">Animated dot-matrix image converter</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Separator />
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm transition ${
                isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
              {file ? (
                <span className="font-medium text-foreground">{file.name}</span>
              ) : (
                <span className="text-muted-foreground">Drop an image or click to upload</span>
              )}
            </div>

            <Tabs defaultValue="grid">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="motion">Motion</TabsTrigger>
              </TabsList>

              <TabsContent value="grid" className="space-y-5 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <NumberSlider label="Columns" value={params.gridW} min={10} max={300} step={1} onChange={(v) => set("gridW", v)} />
                  <NumberSlider label="Rows" value={params.gridH} min={10} max={300} step={1} onChange={(v) => set("gridH", v)} />
                </div>
                <NumberSlider label="Threshold" value={params.threshold} min={0} max={1} step={0.01} onChange={(v) => set("threshold", v)} />
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select value={params.mode} onValueChange={(v) => set("mode", v as ThresholdMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brightness">Brightness</SelectItem>
                      <SelectItem value="alpha">Alpha (silhouette)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="invert">Invert</Label>
                  <Switch id="invert" checked={params.invert} onCheckedChange={(v) => set("invert", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoinv">Auto-invert</Label>
                  <Switch id="autoinv" checked={params.autoInvert} onCheckedChange={(v) => set("autoInvert", v)} />
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-5 pt-2">
                <div className="space-y-2">
                  <Label>Dot shape</Label>
                  <Select value={params.shape} onValueChange={(v) => set("shape", v as DotShape)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dot color</Label>
                    <div className="flex h-9 items-center gap-2 rounded-md border border-input px-2">
                      <input
                        type="color"
                        value={params.color}
                        onChange={(e) => set("color", e.target.value)}
                        className="h-6 w-8 rounded border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-xs text-muted-foreground">{params.color}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="flex h-9 items-center gap-2 rounded-md border border-input px-2">
                      <input
                        type="color"
                        value={params.background}
                        onChange={(e) => set("background", e.target.value)}
                        className="h-6 w-8 rounded border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-xs text-muted-foreground">{params.background}</span>
                    </div>
                  </div>
                </div>
                <NumberSlider label="Dot scale" value={params.dotScale} min={0.2} max={1} step={0.05} onChange={(v) => set("dotScale", v)} />
                <NumberSlider label="Spacing" value={params.gap} min={0} max={0.8} step={0.05} onChange={(v) => set("gap", v)} />
                <div className="flex items-center justify-between">
                  <Label htmlFor="transparent">Transparent background</Label>
                  <Switch id="transparent" checked={params.transparent} onCheckedChange={(v) => set("transparent", v)} />
                </div>
              </TabsContent>

              <TabsContent value="motion" className="space-y-5 pt-2">
                <NumberSlider label="Flicker rate" value={params.flickerRate} min={0} max={1} step={0.01} onChange={(v) => set("flickerRate", v)} />
                <div className="grid grid-cols-2 gap-4">
                  <NumberSlider label="FPS" value={params.fps} min={1} max={30} step={1} onChange={(v) => set("fps", v)} />
                  <NumberSlider label="Duration" value={params.duration} min={1} max={20} step={1} suffix="s" onChange={(v) => set("duration", v)} />
                </div>
                <NumberSlider label="Seed" value={params.seed} min={0} max={9999} step={1} onChange={(v) => set("seed", v)} />
                <div className="flex items-center justify-between">
                  <Label htmlFor="edgeflicker">Edge-only flicker</Label>
                  <Switch id="edgeflicker" checked={params.edgeOnlyFlicker} onCheckedChange={(v) => set("edgeOnlyFlicker", v)} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 xl:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Preview</CardTitle>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {playing ? "Pause" : "Play"}
              </Button>
              <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                {scrub + 1}/{frameCount}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={0}
              max={Math.max(0, frameCount - 1)}
              value={scrub}
              onChange={(e) => {
                setPlaying(false);
                setScrub(Number(e.target.value));
              }}
              className="w-full accent-primary"
            />
            <div className="flex items-center justify-center rounded-lg border border-border bg-black/30 p-4">
              <canvas ref={canvasRef} className="max-h-[82vh] w-auto max-w-full" style={{ imageRendering: "pixelated" }} />
            </div>
            {!grid && !error && (
              <p className="text-center text-sm text-muted-foreground">Upload an image to begin.</p>
            )}
            {error && (
              <p className="text-center text-sm text-destructive">Failed to load image: {error}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Select value={exportKind} onValueChange={(v) => setExportKind(v as typeof exportKind)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="svg">Static SVG</SelectItem>
                  <SelectItem value="animated-svg">Animated SVG</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                  <SelectItem value="png">PNG sequence</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full" disabled={!grid || busy !== null} onClick={() => doExport(exportKind)}>
                <Download className="h-4 w-4 shrink-0" />
                <span className="truncate">{busy ? `Exporting ${busy}…` : `Export ${exportKind.replace("-", " ")}`}</span>
              </Button>
            </div>
            <Separator className="my-5" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <Label>Embed (live widget)</Label>
              </div>
              <Button variant="outline" size="sm" disabled={!grid} onClick={refreshEmbed}>
                Generate snippet
              </Button>
              <textarea
                readOnly
                value={embed}
                placeholder="Click 'Generate snippet' to get drop-in embed code"
                className="h-36 w-full resize-none rounded-md border border-input bg-black/30 p-2 font-mono text-xs leading-relaxed text-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
