# Handoff: Filament (repo `physarum`)

Tracked in git on purpose: the previous git-ignored notes were lost with a laptop.

## State (2026-10-06)

The overhaul started from a fresh history. The old prototype is kept under the tag `legacy-v0`; read it with `git show legacy-v0:<path>`.

Done:
- **Engine** (`src/engine`):
  - Multi-species agents with an interaction matrix.
  - World layer (food, walls, repellent) and brushes.
  - Wrap and bounce boundaries; all six spawn patterns.
  - Speed in steps per frame; bloom and tone map.
  - Generated uniform layouts; deposit scale chosen per run so it can't overflow.
  - Snapshot and field-hash readback.
- **Model** (`src/model`): params schema and clamping, presets, seeded Mutate, share links (deflate + base64url in `#run=`, versioned, with a v1 migration).
- **Studio** (`/studio`): top bar, tool rail, inspector (Species / Mix / Field / World / Print), transport, contact-sheet preset drawer, kept prints in localStorage, PNG and WebM export, shortcuts, first-run hint, phone layout.
- **Landing** (`/`): hero cycling presets with a safelight wipe and the negative wordmark, contact sheet of live frames, scroll-exposed test strip, "Feed it" interactive print, close and footer.
- **Fallback**: a designed no-WebGPU page with a recorded clip (`public/fallback.*`, made by `tools/fallback.mjs`).
- **Tests**: Vitest (layout, params, engine pure parts, share, mutate). GPU tools: verify, determinism, rng-check, shot, sheet.
- **CI**: typecheck, lint, test and build, then deploy to GitHub Pages from `main`.

## Design

- **Product truth:** `PRODUCT.md`.
- **Direction contract:** `.impeccable/surfaces/src-routes-landing-landing-tsx.md`. Its world is **The Darkroom**: darkroom black and fibre paper; safelight red for live state; china-marker yellow for selection, drawn as animated hand marks (`src/ui/Mark.tsx`); Archivo variable (width axis) plus Martian Mono.
- **Visual system:** `DESIGN.md` is the record, generated at the finish.

## Gotchas

- Headless Edge gets a real WebGPU adapter on this machine, so the tools default to `channel: 'msedge'`.
- Git Bash rewrites a bare `/` argument into a Windows path; `tools/shot.mjs` takes routes without the leading slash.
- Setting `ctx.font` resets `ctx.fontStretch`, and the shorthand silently drops `expanded`. The text world is measured and drawn consistently, so it fits.
- A WebGPU canvas only holds its image until it's presented. `snapshot()` renders and calls `toBlob` in the same task.
- Reproducibility holds per GPU: trig rounding differs across hardware.

## Rules

- Never add AI attribution to commits, PRs or docs.
- Ask before every push. Making this history the new `main` needs a force push; push the `legacy-v0` tag first.

## Performance (2026-10-06)

Measured on an integrated Intel Xe-LPG GPU at 1440×900 @2x with `tools/perf.mjs` (frame rate per scroll stop) and per-pass GPU timing.

- **Hero step (the bottleneck):** 39 ms → 9 ms.
  - Sensing reads a single cell by default (`sensorSize` 0). The 3×3 patch looked nearly identical and cost 2.5×.
  - Agents and diffuse skip the world layer while it's empty (`hasWorld`). That halved the reads.
- **Render:** about 5 ms. Pixel density is capped at 1.25×, and the glow runs at quarter resolution with a 4-tap downsample.
- **Steps:** capped at 60/s whatever the refresh rate. Frozen prints only redraw when something changes.
- **Landing:** never more than one live sim on screen.
  - The contact sheet is 4 still prints (`src/features/prints.ts`); hovering one plays it live, pre-stepped to match the print.
  - The test-strip exposure is applied in the composite shader rather than with a CSS `backdrop-filter`.
  - The hero's scroll darkening is an overlay, not a canvas filter.
- **Measuring:** a laptop on battery caps every page at 30 fps (even a blank one). Use GPU timings for comparisons, not page fps.
