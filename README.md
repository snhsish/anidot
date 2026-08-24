# AniDot

Turn any image into a flickering, animated dot-matrix bitmap. Convert photos and
logos into dot-grid art and export it as static/animated SVG, GIF, PNG frames, or
WebM — all in the browser.

## Features

- **Dot-matrix conversion** — downsample any image into a grid of lit/unlit dots.
- **Style controls** — dot shape (circle/square), color, background, dot scale,
  and real inter-dot **spacing**.
- **Motion** — organic flicker with adjustable rate, FPS, duration, and seed.
- **Edge-only flicker** — keep interior dots static and flicker only the boundary.
- **Transparent background** — optional, for overlays and compositing.
- **Exports** — Static SVG, Animated SVG, GIF, PNG sequence (zip), and WebM.

## Monorepo layout

```
apps/web/        Next.js dashboard (the app)
packages/core/   Grid + flicker animation engine (runtime-agnostic)
packages/renderer-canvas/  Live canvas renderer + embed widget
packages/renderer-gif/     GIF encoding
packages/renderer-svg/     Static & SMIL-animated SVG
packages/ui/      Shared UI primitives
```

## Getting started

```bash
pnpm install
pnpm dev      # start the web dashboard (apps/web) via turbo
```

Other scripts (run from the root):

```bash
pnpm build      # build all packages + web
pnpm typecheck  # type-check everything
pnpm test       # run package tests
```

## Deployment

The web app deploys to Vercel. `pnpm.onlyBuiltDependencies` allows `esbuild`'s
build script so `pnpm install` succeeds in CI.

## License

Private.
