# Development

How Filament is built, where things live, and how to check it.

## Stack

Vite, TypeScript and React 19 for the interface. The simulation is raw **WebGPU** and **WGSL**, with no 3D library in between. Supporting libraries:

- Zustand for studio state
- Radix primitives for accessible controls
- GSAP and Lenis for the home page's motion

The site is static and deploys to GitHub Pages; there is no backend.

## Project layout

```
src/
  main.tsx, App.tsx     entry point and routes (/ and /studio)
  engine/               the simulation; knows nothing about React
    shaders/            WGSL: agents, diffuse, brush, scene, bloom, composite
  model/                params schema, presets, Mutate, share-link encoding
  pages/
    home/               the showcase page and its scroll motion
    studio/             the darkroom: stage, store, actions
      components/       top bar, tool rail, transport, inspector, contact sheet…
      inspector/        the five inspector tabs
    unsupported/        the page shown when WebGPU isn't available
  components/           shared UI: hand-drawn marks, scales, buttons, live frames
  lib/                  hooks and helpers that connect the engine to React
  styles/               design tokens and base styles
tests/                  unit tests (Vitest)
scripts/                browser-driven checks and capture tools
docs/design/            product brief and design system
public/                 favicon, social image, no-WebGPU fallback clip
```

## How the simulation works

Every frame, for each step:

1. **Agents** (one GPU thread each) sample the trail at three sensors ahead of them, turn toward the strongest reading, move, and deposit into their species' channel. Each species weighs the four trail channels through a 4×4 interaction matrix, which is how species attract or repel each other.
2. **Diffuse** blurs every cell toward its 3×3 neighbourhood, decays it, and lets food emit scent. It reads one trail buffer and writes the other, then the two swap.
3. **Brush** strokes paint into the world layer (food, walls, repellent), over just the brush's bounding box.

The image is drawn in four stages: an HDR scene pass, a quarter-resolution bloom, then a composite that tone maps, vignettes and dithers.

Design choices worth knowing:

- **Generated uniform layouts.** Uniform structs are generated from one TypeScript definition (`src/engine/layout.ts`), so the WGSL and the packing code can't drift apart.
- **Reproducible runs.** A seeded PCG hash is shared line-for-line between TypeScript and WGSL. Deposits are fixed-point atomics, so GPU scheduling can't change the result. The same params, seed and grid replay bit-for-bit on the same GPU, which is what share links rely on.
- **Overflow-safe deposits.** The deposit scale is chosen per run so the worst case can't overflow 32 bits.

## Performance

The engine is tuned to hold 60 fps on integrated laptop GPUs (measured on Intel Xe):

- **Single-cell sensors by default.** The field is already blurred every step, so averaging a patch around each sensor looks nearly identical and costs about 2.5× the step time.
- **Empty worlds aren't read.** The world layer is skipped until something is painted or generated, which halves the memory reads.
- **At most 60 steps a second** on any display. Paused prints only redraw when something changes.
- **Capped pixel work.** Pixel density is capped at 1.25×, and bloom runs at quarter resolution with a 4-tap downsample.
- **One live sim at a time on the home page.** The contact sheet shows prints and plays a frame live only on hover, and effects are done in shaders rather than CSS filters over the canvas.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run check` | Typecheck, lint, and unit tests |
| `npm run build` | Production build into `dist/` |
| `npm run verify -- tokyo` | Opens a preset in a real browser and checks the canvas develops |
| `npm run determinism` | Checks presets replay bit-for-bit and a different seed doesn't |
| `npm run rng-check` | Checks the WGSL and TypeScript random streams agree |
| `node scripts/perf.mjs <url>` | Frame rate at a series of scroll positions |
| `npm run fallback` | Re-records the no-WebGPU clip and poster |

The browser checks need a GPU, so they run locally against the dev server, not in CI. They use Edge by default; set `PW_CHANNEL=chrome` to switch.

## Gotchas

- **A WebGPU canvas only holds its image until it's presented.** `snapshot()` renders and calls `toBlob` in the same task.
- **Canvas text and font stretch.** Setting `ctx.font` resets `ctx.fontStretch`, and the font shorthand silently drops `expanded`. The text world is measured and drawn with the same settings, so it still fits.
- **Laptops on battery cap pages at 30 fps.** Use GPU timings, not page frame rate, to compare performance.
- **Some networks block new GitHub Pages sites.** A DNS security filter may block a freshly created `*.github.io` domain until it's categorised.

## Design

The product brief is `docs/design/PRODUCT.md` and the design system is `docs/design/DESIGN.md`. The visual direction is "The Darkroom":

- warm darkroom black and fibre-paper white
- safelight red for anything live
- a china-marker yellow hand mark for selection
- Archivo across its width axis, with Martian Mono for readouts
