# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: Vite + TypeScript + React 19 for the UI, raw WebGPU/WGSL for the simulation engine (millions of agents in compute shaders, so no 3D library in between), Zustand for state, Radix primitives for accessible controls, GSAP + Lenis for landing motion. Static site on GitHub Pages; no backend.

## Users

Two audiences, served by the same product:
- **People evaluating the author's work** (recruiters, developers, the creative-coding crowd). They arrive from a link, look for a minute, and decide whether it is impressive.
- **People who like playing with living visuals.** They open the studio, mess with it, make something beautiful, and share it.

It is not a teaching tool. Depth of explanation is optional; it just has to look and feel remarkable.

## Product Purpose

Filament is a browser-based slime-mould (Physarum) simulation. Millions of agents follow one sense–turn–deposit rule on a shared trail field, and glowing organic networks emerge from it. Success means three things: the first viewport makes someone stop, the interface feels smooth and crafted down to the animation, and playing with it is fun enough that people make and share their own runs.

## Positioning

A real-time, GPU-native multi-species Physarum you can paint into: food, walls, repellent and attractant brushes, up to four interacting species, live everywhere WebGPU runs. Runs are fully reproducible from a link (params + seed).

## Capabilities and Constraints

- Up to 4 species with per-species sensing and motion, plus a 4×4 attraction/repulsion matrix.
- World layer: food (persistent attractant), walls, repellent; generated from presets (scatter, text, a Tokyo-style city map) or painted with brushes.
- Spawn patterns: scatter, centre, ring, inward ring, grid, on food. Boundaries: wrap, bounce.
- Share links encode params + seed. Brush strokes are not part of the link.
- Export: PNG snapshots and WebM recordings.
- Requires WebGPU. Browsers without it get a designed fallback, never a black screen.
- Reproducibility holds for the same params, seed, grid size and GPU.

## Brand Commitments

- Name: **Filament**, used everywhere, including the repo and the URL.
- Voice: minimal, almost no copy. Labels and a few lines; the organism does the talking.
- Must link to the author's GitHub (`vipinsudhakar`) and the repo.

## Evidence on Hand

- The live simulation itself is the only imagery; no stock or illustration.
- No testimonials, users, press or metrics exist. Do not fabricate any.
- The science behind it (Jones 2010 agent model; Tero et al. 2010 Tokyo rail experiment) may be credited, but the author did not require it.

## Product Principles

1. The organism is the hero. Chrome exists to frame and control it, and recedes when not in use.
2. Every interaction should feel physical and smooth. Motion is part of the product, not decoration.
3. Fun before completeness: the fastest path from landing to "I made this" wins.
4. Shareable by default: whatever someone makes can be linked, saved or exported in one step.
