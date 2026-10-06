---
name: Filament
description: A live slime-mould print, developed, marked up and printed in a darkroom.
colors:
  dark-0: "#0b0908"
  dark-1: "#14100e"
  dark-2: "#1d1714"
  dark-3: "#2a221d"
  dark-line: "rgb(235 228 212 / 11%)"
  dark-line-strong: "rgb(235 228 212 / 22%)"
  paper: "#ebe4d4"
  paper-shade: "#ddd4c1"
  paper-ink: "#17110d"
  paper-ink-dim: "#5c5248"
  paper-line: "rgb(23 17 13 / 14%)"
  print-border: "#f8f4ec"
  on-dark: "#ebe4d4"
  on-dark-dim: "#a49c8f"
  on-dark-faint: "#6f685e"
  safelight: "#c0301c"
  safelight-hover: "#d2381f"
  safelight-text: "#ec5b43"
  safelight-deep: "#8f2412"
  safelight-wash: "rgb(192 48 28 / 55%)"
  marker: "#f4cf3e"
  edge: "#e39a3b"
  organism-amber: "#f2b45a"
  organism-paper: "#e8e0cf"
  organism-rust: "#d4513a"
  organism-cyanotype: "#6b9ec4"
  field-food: "#ffe6a8"
  field-wall: "#16120f"
  field-repel: "#ff3b4e"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(36px, 15.2vw, 260px)"
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(48px, 8.4vw, 136px)"
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 62"
  title:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 112"
  body:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-lg:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  action:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 750
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 88"
  label:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 560
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 78"
  readout:
    fontFamily: "'Martian Mono Variable', 'Martian Mono', ui-monospace, monospace"
    fontSize: "17px"
    fontWeight: 450
    letterSpacing: "0.02em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 88"
  edge-print:
    fontFamily: "'Martian Mono Variable', 'Martian Mono', ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 400
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 80"
rounded:
  s: "3px"
  pill: "999px"
  disc: "50%"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "72px"
  s-9: "120px"
components:
  button-safelight:
    backgroundColor: "{colors.safelight}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 24px 0 32px"
  button-safelight-hover:
    backgroundColor: "{colors.safelight-hover}"
  button-safelight-compact:
    backgroundColor: "{colors.safelight}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 16px 0 12px"
  button-outline:
    textColor: "{colors.on-dark}"
    rounded: "{rounded.pill}"
    height: "30px"
    padding: "0 12px"
  button-outline-hover:
    backgroundColor: "{colors.dark-2}"
  icon-button:
    textColor: "{colors.on-dark-dim}"
    rounded: "{rounded.s}"
    height: "36px"
    padding: "0 8px"
  icon-button-hover:
    backgroundColor: "{colors.dark-2}"
    textColor: "{colors.on-dark}"
  play-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.disc}"
    size: "42px"
  chrome-blade:
    backgroundColor: "{colors.dark-1}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.s}"
    padding: "4px"
  inspector-panel:
    backgroundColor: "{colors.dark-1}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.s}"
    width: "308px"
  paper-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.s}"
    padding: "24px"
  toast:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.s}"
    padding: "9px 30px 9px 14px"
  tooltip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.s}"
    padding: "5px 8px"
  text-field:
    backgroundColor: "{colors.dark-0}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.s}"
    height: "38px"
    padding: "0 12px"
---

# Design System: Filament

## Overview

**Creative North Star: "The Darkroom"**

Filament is a darkroom. The organism is a print developing under the safelight; the visitor exposes it, marks it up with a china marker, and prints it. Everything that is not the organism is darkroom equipment: easel blades, a timer, film rebates with edge printing, contact sheets, test strips, fibre paper. The organism supplies all the light in the room, so chrome is dark, flat and quiet, and recedes until a hand reaches for it.

There are two grounds and two marks. Darkroom black carries the live print and every piece of studio chrome; fibre paper carries what has come out of the darkroom (contact sheets, the test-strip print border, popover sheets, toasts, tooltips, the no-WebGPU fallback). Safelight red means something is live or is the one act on a surface. China-marker yellow is the hand that circles what is chosen. Amber edge printing labels frames, codes and readouts. The build refuses the generative-showcase default of a black page, blur glass, neon headline and preset cards.

Density is low on the landing (the print fills the viewport, copy is a few lines) and instrument-dense in the studio, where small condensed caps, mono readouts and graduated scales sit in narrow blades around a full-bleed print. Motion follows one grammar: things develop up out of black on a long exponential settle, marks draw themselves on, and nothing bounces.

**Key Characteristics:**
- The live organism is the only imagery and the only light source; chrome never competes with it.
- Two grounds (darkroom black, fibre paper) and two marks (safelight red, china-marker yellow).
- Flat chrome blades with 3px corners and a hairline; paper objects alone cast a shadow.
- Archivo across its width axis: condensed caps for heads and labels, very wide for the name.
- Martian Mono for every number and every piece of edge printing.
- Selection is drawn by hand, never a fill, tint or ring.
- Motion develops, draws on and settles; it never springs.

## Colors

A warm, near-monochrome darkroom of brown-blacks and unbleached paper, struck by exactly two marks: a safelight red and a china-marker yellow.

### Primary
- **Safelight Red** (safelight): the fill of the one primary act on a surface ("Enter the darkroom" on the landing, "Mutate" in the transport), the safelight wipe between hero frames, and the recording wash. It deepens slightly on hover (safelight-hover) and never fills chrome bodies.
- **Safelight Lamp** (safelight-text): the legible red for live state on the dark: the active hero frame code, FRAME / EXP timer labels, the repel brush ring, a recording button, the scale needle and the input caret.
- **Safelight Ink** (safelight-deep): red set on paper, for key glyphs in the shortcuts sheet and the error detail on the fallback page.
- **Safelight Wash** (safelight-wash): the inset red glow that floods the edges of the studio while recording.

### Secondary
- **China Marker** (marker): the hand's mark. Selection loops and underlines, the focus outline, text selection, hover colour on links in the rebate and footer, the food brush ring, the first-run note and arrow. It is a stroke colour; it is never a panel fill.

### Tertiary
- **Edge-Print Amber** (edge): film-edge printing on dark grounds: frame codes (01A to 08A), preset codes beside names, the inspector rebate, band exposure times on the test strip, the landing rebate's frame list.

### Neutral
- **Darkroom Black** (dark-0): the page, the stage behind the canvas, text-field and matrix-cell wells, and the default print ground.
- **Easel Black** (dark-1): the body of every chrome blade: top bar groups, tool rail, transport, inspector.
- **Lifted Black** (dark-2): hover and open-state fill inside chrome.
- **Rebate Black** (dark-3): pressed state, the inspector rebate strip, scrollbar thumb.
- **Darkroom Hairline** (dark-line) and **Strong Hairline** (dark-line-strong): section dividers inside panels; blade edges, scale graduations, outlined-button strokes and vertical dividers.
- **Fibre Paper** (paper) and **Paper Shade** (paper-shade): the light ground for contact sheet, feed section, fallback page, popover sheets, toasts and tooltips; shade is the hover fill on paper.
- **Print Border** (print-border): the slightly brighter white margin around a print lying on paper.
- **Paper Ink** (paper-ink) and **Paper Ink Dim** (paper-ink-dim): text on paper; also the black film base of contact strips and contact prints.
- **Paper Hairline** (paper-line): row rules on paper sheets.
- **Paper White on Dark** (on-dark), **Dim** (on-dark-dim) and **Faint** (on-dark-faint): text on dark at three strengths. Primary readings and active items; labels, inactive options and secondary copy; placeholder, disabled and non-essential meta only.

### Organism and field colours
The organism's colours are content, not chrome, and live in the engine. Species defaults are darkroom chemistry: warm-tone amber (organism-amber), paper white (organism-paper), rust (organism-rust), cyanotype blue (organism-cyanotype). Painted fields render food (field-food), walls (field-wall) and repellent (field-repel). Print grounds offered in the studio are all dark (Darkroom, Black, Night `#0a0e16`, Oxblood `#170907`, Moss `#0c120d`) because the organism is emissive and screens over its ground: the composite tone-maps exponentially, screens over the ground, vignettes, and dithers below one 8-bit step.

### Named Rules
**The Two Marks Rule.** Red means live or the one act; yellow means chosen by hand. No third accent enters the chrome, and the two never swap jobs.

**The Organism Is Content Rule.** Species, food, wall and repel colours belong to the print. They never colour chrome, type or controls (the species swatch disc that shows an emission colour is the single bridge).

**The Faint Is Not For Reading Rule.** on-dark-faint (about 3.4:1 on the blades) carries placeholders, disabled states and throwaway meta; anything a person must read uses on-dark-dim or stronger.

## Typography

**Display Font:** Archivo Variable (with Archivo, system-ui, sans-serif), used across its width axis
**Body Font:** Archivo Variable
**Label/Mono Font:** Martian Mono Variable (with Martian Mono, ui-monospace, monospace)

**Character:** One grotesque stretched from 62% to 125% width does all the voice work, the way chemical labels and film-edge printing are condensed technical caps and a maker's name is set wide. Martian Mono is the darkroom timer and the edge print: every digit, code and readout.

### Hierarchy
- **Display** (800, clamp(36px, 15.2vw, 260px), line-height 0.8, width 125%, -0.035em): the name FILAMENT across the hero's lower third, paper white with difference blending so it reads as a negative of the print beneath. The same wide 800 cut, at 12 to 15px, is the wordmark in the landing rebate and the studio top bar.
- **Headline** (800, clamp(48px, 8.4vw, 136px), line-height 0.86, width 62%, uppercase): landing section heads (Contact sheet, the test-strip line, Feed it). The close ("Make a print.") pushes the same cut to clamp(72px, 15vw, 260px).
- **Title** (800, 17 to 24px, width 108 to 120%, uppercase): short titles on overlays and inside prints: preset-sheet groups, the shortcuts sheet, test-strip band words, the fallback headline. Inspector section heads use 750 at 14px, width 100%.
- **Body** (400, 14px, line-height 1.5): tagline, notes, toast and shortcuts copy. On paper sections, notes step up to body-lg (17px, 1.45) and hold to about 30 to 34ch.
- **Action** (700 to 750, 12 to 14px, width 85 to 88%, 0.06em, uppercase): labels on pills and on rebate navigation.
- **Label** (560 to 650, 11 to 12px, width 78 to 85%, 0.05 to 0.07em, uppercase): scale and field labels, tool names, tab triggers, tooltips.
- **Readout** (Martian Mono 450, 14 to 17px, width 88%, tabular numerals): frame counter, exposure clock, slider values.
- **Edge print** (Martian Mono 400, 10 to 11px, width 80 to 82%, 0.04em): frame codes, rebates, band times, fps and agent meta, footer.

### Named Rules
**The Width Axis Rule.** Hierarchy is carried by width and weight, not by more families: condensed (62%) for big section heads, mid (78 to 88%) for labels and actions, wide (108 to 125%) for the name and short titles. Big section headlines are never set wide.

**The Timer Rule.** Every number a person reads (frames, seconds, values, codes) is Martian Mono with tabular figures, so readouts never jitter as they tick.

**The Caps Are Labels Rule.** Uppercase is for heads, labels and actions. Sentences (tagline, notes, toasts, first-run note) stay in sentence case.

## Layout

The landing is a vertical darkroom sequence of full-width bands that alternate ground: hero on black (100svh, min 560px), contact sheet on paper, test strip on black, feed section on paper, close on black. Section padding is 120px block with clamp(16px, 5vw, 72px) inline. Heads sit on a two-column grid (headline, then a 30 to 32ch note aligned to its baseline) that stacks below 900px. The hero bottom is a three-column grid (timer readout left, tagline centre, red action right) that drops the tagline at 900px and stacks with a full-width action at 640px.

The studio is a fixed full-bleed stage. Chrome floats over the print at a 12px inset: top bar groups along the top, tool rail vertically centred on the left, transport centred on the bottom, inspector a 308px column on the right between top bar and transport. Below 760px the rail turns horizontal above the transport, the inspector becomes a bottom sheet (62svh, max 520px) inset 8px, and non-essential actions and readouts hide. Hiding the UI fades all chrome to zero and leaves only the print.

Spacing is a single 4px measure (s-1 to s-9: 4, 8, 12, 16, 24, 32, 48, 72, 120). Inside chrome the working steps are 4 to 16px; landing composition uses 24 to 120px. Breakpoints in use: 980px (transport meta), 900px (landing grids), 760px (studio mobile), 640px (landing mobile), 560px (preset sheet columns).

## Elevation & Depth

Depth is material, not ambient. Chrome sits flat on the print like an easel blade: a solid body and a strong hairline (1px solid dark-line-strong), with no shadow and no blur. Only things made of paper or film cast a shadow, because they physically lie on something: popover sheets, the shortcuts sheet, toasts, the remove chip on a kept print, contact strips on the paper, and prints with white borders. The one light source that throws a glow is red: the primary pill's safelight glow and the recording wash. Species swatches glow in their own emission colour because they are samples of light.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 30px 60px -20px rgb(0 0 0 / 70%)`): paper sheets over the dark (preset popover, shortcuts).
- **Toast lift** (`box-shadow: 0 12px 30px -10px rgb(0 0 0 / 60%)`): the paper toast above the transport.
- **Strip on paper** (`box-shadow: 0 18px 36px -24px rgb(23 17 13 / 70%)`): a strip of film lying on the contact sheet.
- **Print on paper** (`box-shadow: 0 2px 3px rgb(23 17 13 / 18%), 0 30px 60px -28px rgb(23 17 13 / 60%)`): a bordered print just off the easel.
- **Safelight glow** (`box-shadow: 0 10px 40px -8px rgb(192 48 28 / 55%)`, hover `0 14px 50px -6px rgb(192 48 28 / 70%)`): the landing's primary pill only.
- **Recording wash** (`box-shadow: inset 0 0 160px 10px var(--safelight-wash)`): the studio stage while recording.

### Named Rules
**The Easel Blade Rule.** Chrome is flat: solid dark body, hairline edge, 3px corners. If it floats on a shadow or a blur, it has become a card, and the world has no cards.

**The Paper Casts Shadow Rule.** A shadow means an object made of paper or film is lying on something. Dark chrome never gets one.

## Shapes

Two shapes do almost all the work. Containers (blades, panels, sheets, toasts, tooltips, fields, matrix cells) take 3px corners: square enough to read as cut metal and paper, just eased. Labelled actions take a full pill. Discs (50%) are for things that are physically round: the play button, close buttons, colour swatches, print grounds, matrix dots, the brush cursor. Prints are rectangles with a white border (10 to 22px) and at most a fraction of a degree of tilt; contact strips are black film bases with repeating sprocket holes above and below. Film rebates (sprocket holes with edge printing between) run across the top of the landing hero and the inspector panel.

### Named Rules
**The Cut Paper Rule.** No container is rounded beyond 3px. Softness comes from paper, light and motion, never from radius.

## Components

### Buttons
Tactile instruments: low-key until touched, with one red act per surface.
- **Shape:** full pill for labelled actions (999px); 3px for icon buttons; a disc for play.
- **Safelight (primary):** safelight fill, paper text, uppercase action type, 52px tall on the landing and 36px in the transport. One per surface. Hover deepens to safelight-hover; on the landing the gap to the arrow widens and the glow grows; in the studio it presses to 0.97 and its icon turns.
- **Outline (secondary):** transparent with a strong-hairline pill stroke, paper text, 30px, 11px action caps; hover fills dark-2 and the stroke brightens to on-dark-faint.
- **Icon button:** 36px, on-dark-dim icon (18px, 1.6 stroke); hover lifts to on-dark on dark-2, press to dark-3; disabled at 35% opacity. A live tone turns it safelight-lamp red. Tooltips are paper tabs in 11px edge caps, shown after a 380ms delay.
- **Play:** a 42px paper disc with ink glyph; hover scales to 1.05, press to 0.96.
- **Focus:** a 2px china-marker outline at 2px offset on every focusable element; fields swap their border to marker instead.

### Chips
- **Species chips:** a 16px disc of the species' emission colour, glowing in its own light, with the letter beside it in label caps. Selected is on-dark with a marker loop; unselected is on-dark-dim.
- **Segmented options:** plain text options at 14px, width 88%; the checked option goes on-dark and gets a marker underline. No pills, no fills.

### Cards / Containers
- **Corner Style:** 3px.
- **Background:** dark-1 for chrome; paper for sheets, toasts and tooltips.
- **Shadow Strategy:** none on dark chrome; sheet or toast lift on paper (see Elevation & Depth).
- **Border:** 1px dark-line-strong on chrome blades; paper objects carry no border.
- **Internal Padding:** 4px inside top-bar groups, 12px by 8px inside the rail, 12px by 16px inside inspector content, 24px inside paper sheets.

### Inputs / Fields
- **Graduated scale (slider):** a ruler, not a track. A hairline base with a major tick every tenth and a minor tick every fiftieth; the filled range is a 1px paper line; the thumb is an index needle (a paper cap over a 2px safelight-lamp line) that stretches vertically on hover and drag. Label in label caps left, value in readout mono right with a faint unit.
- **Text field:** dark-0 well, strong-hairline border, 3px corners, 38px; typed text is wide (110%) 700 Archivo at 17px. Focus turns the border marker yellow. Caret is safelight-lamp red.
- **Interaction matrix:** 44px dark-0 cells with a hairline; attraction is a filled paper disc, repulsion a safelight-lamp ring, size is strength; drag vertically to set.

### Navigation
- **Studio top bar:** two flat blades. Left carries the wide wordmark and the current frame (amber code plus condensed name) which opens the paper preset sheet; right carries icon buttons. While recording, the record button sits on a 16% safelight fill and pulses.
- **Tool rail:** a vertical blade of 60px tools (20px icon, 11px label caps); the active tool is circled by a china-marker loop. Below it, a brush size stepper with a live-size ring and a mono reading.
- **Inspector tabs:** label-caps triggers on-dark-faint, active on-dark with a marker underline; tab content develops in from brightness 0.3 over 380ms.
- **Landing rebate:** a 44px film rebate across the hero top: wide wordmark, amber frame codes (the exposing one in safelight lamp), and condensed caps navigation that hovers to marker.

### China-Marker Mark (signature)
The single selection device in the product: active tool, current tab, chosen option, chosen ground, hovered contact-sheet frame. It is a generated, seed-stable path in three shapes (an overshooting loop, a wobbly underline, a tick), stroked 2.4px in marker yellow with round caps, roughened by a shared fractal-noise displacement filter so it reads as wax. It draws on over 520ms on the standard ease-out and lifts off faster (200ms). The first-run arrow uses the same stroke and filter.

### Transport
A bottom-centre blade holding play, step, a darkroom timer (red FRAME label over a 17px mono counter, fps and agent count in faint edge print), speed options in mono, reset and seed actions, the red Mutate pill, and panel toggles.

### Contact print
Live preset thumbnails as contact prints: 4px of black film base around the image, an amber mono rebate line above with code and name, a marker loop on hover, and a slight brightness lift. A developing state shimmers from dark to darker brown.

## Do's and Don'ts

### Do:
- **Do** let the organism carry all the light; keep chrome on dark-1 with a 1px dark-line-strong edge and 3px corners.
- **Do** use the china-marker mark (2.4px marker stroke, wax filter, draw on in 520ms) for every selection state.
- **Do** keep exactly one safelight pill per surface for the primary act, and use safelight lamp for live state.
- **Do** set every number and code in Martian Mono with tabular figures.
- **Do** move with cubic-bezier(0.19, 1, 0.22, 1) for things that develop and cubic-bezier(0.16, 1, 0.3, 1) for state changes; bring new content up from black (brightness or opacity) rather than sliding it in from far away.
- **Do** honour reduced motion: content is laid out visible, and scroll timelines only run when motion is allowed.
- **Do** put paper objects (sheets, toasts, tooltips, prints) on the paper palette with a lift shadow, and keep borders off them.

### Don't:
- **Don't** author blur glass, backdrop blur, neon teal or pink, or glowing gradient text into the chrome (the cyan a negative wordmark shows over amber is inversion, not an authored colour).
- **Don't** round a container past 3px or set content in rounded cards.
- **Don't** show selection with a tinted fill, a coloured ring or a checkbox-style highlight; draw the mark.
- **Don't** give dark chrome a drop shadow.
- **Don't** colour chrome with species or field colours.
- **Don't** use bounce, spring or overshoot easing; marks and prints settle.
- **Don't** set big section headlines wide, or add a second sans family.
- **Don't** use on-dark-faint for text someone has to read.
