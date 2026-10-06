---
version: 1
slug: "src-routes-landing-landing-tsx"
primary_target: "src/routes/landing/Landing.tsx"
related_targets: ["src/routes/studio/Studio.tsx"]
---

# Filament: landing (/) and studio (/studio)

Scope: the landing page is an **Experience** surface where the organism leads, a hands-off showcase first. The studio is an **Operate** surface: a full-screen live sim with tools. Both share one world.

Audience: portfolio visitors and generative-art players (see PRODUCT.md). Job: be stopped by the first viewport, then play and make something to share. Constraints: minimal copy; no neon, no cards, no Inter-style AI look, nothing precious or hard to use, no dashboards.

## Direction contract

THESIS: Filament is a darkroom. The organism is a print developing under the safelight, and you expose it, mark it up and print it. It refuses the generative-showcase default of a black page, glass panel, neon headline and a row of preset cards.

OWN-WORLD:
- Grounds: warm darkroom black (#0b0908) and fibre-paper white (#ebe4d4). Prints come out onto the paper.
- Accents: safelight red (#c0301c) means live state (recording, active, exposing); china-marker yellow (#f4cf3e) is the hand mark for selection.
- Organism defaults: darkroom chemistry colours (warm-tone amber, paper white, rust, cyanotype blue); no neon teal or pink.
- Type: condensed technical caps for every section head, like film-edge printing and chemical labels; the wide cut is reserved for the name FILAMENT; digits from a darkroom timer.
- Edges: no blur glass, no rounded cards. Studio chrome is flat blades with 3px corners and a hairline; the pill is kept only for the one red action. Prints have white borders; strips show frame numbers, and so does the inspector rebate.

STORY: A visitor watches a print develop out of black, sees the run change frame by frame on a timer, scrolls onto paper where every preset hangs as a contact sheet, reads four words on a test strip, then enters the darkroom (studio) to make their own print, save it and share it.

FIRST VIEWPORT: The live organism fills the whole viewport and develops up from black. "FILAMENT" is set very wide across the lower third as a darkroom negative: paper white with difference blending, so the letters show the print beneath them inverted, the way a negative does. This was recorded after the build and checked across all 8 presets. A darkroom timer readout (frame number, exposure seconds, preset name in edge-print caps) sits bottom-left. One action, "Enter the darkroom", is a red-lit pill at bottom-right. A tiny frame strip at the top edge shows which of the 8 presets is exposing, and it advances itself every ~9s with a red safelight wipe.

FORM: The Darkroom, #1 on my grounded list (IMPECCABLE’S PICK). Seed key 93646739. The decision page (round 4c621bf3) closed before an answer arrived, so the choice was put to the user again through the structured question fallback. The user picked "The Darkroom (my pick)" in-session on 2026-10-06. Signature interaction: grease-pencil marks. Selection (active tool, chosen frame, hovered print) is an animated hand-drawn china-marker stroke, and recording turns the studio chrome safelight red. Motion grammar: things develop (fade up from black with lifted contrast), marks draw on, and nothing bounces.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Preset thumbnails are rendered live in the browser from the engine (no shipped rasters).
