---
name: SLUR
description: Cold Space. Warm Energy. A race-broadcast lower third laid over the live game world.
colors:
  marigold: "#f59a24"
  core: "#ffe0a0"
  void: "#05060a"
  deep: "#0a1117"
  space: "#162028"
  readout: "#eceff2"
  readout-dim: "#8b929b"
typography:
  display:
    fontFamily: "Chakra Petch, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(34px, 5vw, 64px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.01em"
  wordmark:
    fontFamily: "Chakra Petch, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "0.42em"
  title:
    fontFamily: "Chakra Petch, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "0.14em"
  body:
    fontFamily: "Chakra Petch, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Chakra Petch, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    letterSpacing: "0.2em"
  label:
    fontFamily: "Chakra Petch, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.22em"
  meta:
    fontFamily: "Chakra Petch, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.16em"
rounded:
  none: "0px"
spacing:
  label-gap: "6px"
  chip-gap: "8px"
  stack: "16px"
  column: "24px"
  gutter: "20px"
  gutter-wide: "40px"
  control-height: "44px"
components:
  button-primary:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.deep}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 28px"
    height: "{spacing.control-height}"
  button-primary-active:
    backgroundColor: "{colors.core}"
    textColor: "{colors.deep}"
  button-primary-focus:
    backgroundColor: "{colors.core}"
    textColor: "{colors.deep}"
  input-callsign:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.readout}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "{spacing.control-height}"
  ship-picker:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.readout}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    height: "{spacing.control-height}"
  room-chip:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.readout}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
    width: "208px"
  menu-strip:
    backgroundColor: "{colors.space}"
    textColor: "{colors.readout}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  key-cap:
    textColor: "{colors.readout}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "24px"
---

# Design System: SLUR

## Overview

**Creative North Star: "The Broadcast Lower Third"**

The menu is the game already running. A live cruise shot of the real track fills the screen: the game's own deck, fog, asteroids and nebula, with the player's chosen ship flying it. The interface is a race-broadcast graphic laid over that shot. It is a dark, square-cut strip across the bottom, tight uppercase labels, stat-style readouts, and one sweeping marigold rule. It is not a poster in front of the game. Nothing covers the world except a low scrim that gives the type something to sit on.

"Cold Space. Warm Energy." The cold is graphite and near-black, taken from the scene itself. The warmth is one colour, marigold, spent only where the player acts. The density is low. There are three controls, one primary action, and a row of live-run chips. Everything is legible at a glance from across an office. The look is TRON-influenced and not TRON-literal. It uses hard edges and a single energy colour. It does not use neon outlines, glass panels or cyan glow.

The DOM overlay and the R3F canvas are separate layers. Tailwind styles only the DOM. The scene's look lives in the scene code.

**Key Characteristics:**
- A full-bleed live 3D backdrop is the hero. The DOM is a lower third over it.
- One warm colour (marigold) on a cold graphite field.
- One typeface, Chakra Petch, for every piece of menu type.
- Zero corner radius. There are 1px hairlines and no glass.
- A 44px control line. All strip controls share one height and one baseline.
- Motion is small and purposeful: a rule that sweeps, a ship that banks, a live dot that pulses. All of it stops under reduced motion.

## Colors

A cold graphite field lit by a single warm signal.

### Primary
- **Marigold** (`--color-marigold`): the only energy colour. It fills the primary action (HOST). It draws the 1px rule under the selected ship name. It is the text caret, the focus border of the call-sign field, the hover and focus border and action word of a live-run chip, and the text-selection highlight. It never fills a surface larger than one button.
- **Core** (`--color-core`): the hot centre of marigold. It appears only when the primary button is pressed or focused, as its fill and its 2px focus outline.

### Neutral
- **Void** (`--color-void`): the root page background under everything. It shows only before the canvas paints.
- **Deep Space** (`--color-deep`): the field colour of every control: the input, the ship picker, and the chips at 85% opacity. It is also the text colour on marigold, and the tint of the scrim.
- **Space Grey** (`--color-space`): the lower-third strip. It is one step lighter than the controls, so the controls sit into it.
- **Readout White** (`--color-readout`): all primary type, a neutral white rather than a blue-white. At 15%, 20%, 25% and 40% alpha it draws every hairline border: the strip top edge and chip borders (15%), control borders (20%), keycaps (25%) and control hover (40%).
- **Readout Dim** (`--color-readout-dim`): field labels, the ship class, key-hint words, chip metadata, the input placeholder and resting chevrons.

### Named Rules
**The One Warm Voice Rule.** Marigold marks where the player acts, and only there. Use it on the primary control, the active selection, the caret, the focused field and the hovered chip. It is never a background wash, a decorative border or a heading colour. Core appears only on a pressed or focused primary.

**The Neutral Readout Rule.** Menu text is Readout White or Readout Dim. Do not use the cooler panel whites (`--color-hud`, `--color-fg`) on this surface.

## Typography

**Display Font:** Chakra Petch (self-hosted woff2, weights 400/600/700, with ui-sans-serif, system-ui fallback)
**Body Font:** Chakra Petch
**Label/Mono Font:** Chakra Petch (the same face, set in tracked uppercase)

**Character:** One squared, technical sans that reads as a broadcast or telemetry face. The hierarchy comes from weight, case and tracking, not from a second family. Always reference the face through `--font-readout` (the `font-readout` utility). Never name the family directly.

### Hierarchy
- **Display** (700, clamp(34px, 5vw, 64px), line-height 0.95, 0.01em, uppercase, max 16ch, balanced): the one tagline over the backdrop.
- **Wordmark** (700, 20px, 0.42em): the SLUR mark, top left. It is small and widely tracked, and never a hero.
- **Title** (600, 15–16px, 0.14em uppercase for the ship name; no tracking for a chip's host name): the value a control holds.
- **Body** (400, 16px, line-height 1.5, max 60ch): the one-line pitch and the input value. The empty-state line uses 15px.
- **Button** (700, 14px, 0.2em, uppercase): the primary action label.
- **Label** (600, 11px, 0.22em, uppercase, Readout Dim): field labels over controls. Section headings in the backdrop use the same treatment at 12px.
- **Meta** (400, 12px, 0.14–0.16em, uppercase, Readout Dim): stat readouts such as "Class · Freighter", "2 racers · Racing", and key-hint words.

### Named Rules
**The One Face Rule.** Every piece of menu type is Chakra Petch. The system sans on `body` is an inherited default, and the menu overrides it at its root.

**The Readout-Over-World Rule.** Type laid directly on the backdrop carries `text-shadow-readout` (a dark 5px drop plus a 2px halo). The scrim darkens the lower 60% of the screen. Together they keep text at WCAG AA however bright the scene gets. Type inside the strip does not need the shadow.

## Layout

A single screen that never scrolls. It is a column with the header at the top, and the pitch, live runs and strip pushed to the bottom (`mt-auto`). The top two-thirds stay open for the world.

- **Gutters:** 20px, or 40px from the `sm` breakpoint (640px). Header top padding is 20px, or 28px from `sm`.
- **Strip grid:** a single stacked column on narrow screens (16px gap). From `sm` it is three columns: call sign (up to 15rem), ship (up to 17rem), HOST (auto), with a 24px gap, aligned to the bottom. From `lg` (1024px) a fourth, flexible column holds the key hint, right-aligned. The key hint is hidden below `lg`.
- **Rhythm:** 6px between a label and its control, 8px between chips, 10px between a section heading and its content, 16px and 24px between groups.
- **Live runs:** a single horizontal row of chips. On narrow screens it bleeds to the screen edge and scrolls sideways.
- **Stacking:** canvas `z-0` (fixed, inset 0), scrim `z-[1]` (fixed, pointer-events none), content `z-[2]`.
- **Portrait:** the backdrop camera tilts down and the ship moves forward, so the ship stays in view above the strip.

## Elevation & Depth

Depth comes from the 3D world, not from the UI. The DOM is flat and tonal: Deep Space controls sit into a Space Grey strip, and hairlines separate the layers. Two soft shadows exist, and both have one job.

### Shadow Vocabulary
- **Strip lift** (`--shadow-strip`: `0 -14px 36px rgba(10, 17, 23, 0.55)`): cast upward from the strip onto the backdrop, so the lower third reads as a physical bar over the shot.
- **Primary hover** (`--shadow-cta`: `0 6px 18px rgba(245, 154, 36, 0.3)`): a warm marigold glow under the primary button on hover only.
- **Readout drop** (`--text-shadow-readout`): a legibility shadow on type over the backdrop. It is not elevation.
- **Scrim** (`scrim` utility): a Deep Space gradient from 94% at the bottom edge to transparent at 60% height, plus a faint radial in the top-left corner behind the wordmark.

### Named Rules
**The Flat Overlay Rule.** UI surfaces are flat at rest. Glow appears only as a response to hover on the primary. There is no glass and no backdrop-blur.

## Shapes

Square-cut everywhere. Every rectangle has a 0px radius: strip, input, picker, chips, keycaps and the primary button. Borders are 1px hairlines in Readout White at low alpha. The only marigold line is the 1px selection rule under the ship name. It is inset 12px from each side, 6px from the bottom. The live-run dot is a 6px square, not a circle. Chevrons are 2px square-capped SVG strokes (10×16 viewBox).

## Components

### Buttons
Heavy and direct. There is one per screen, and it is the only marigold fill.
- **Shape:** square (0px), 44px tall, 28px side padding, 12px gap to a trailing chevron.
- **Primary:** a Marigold fill with Deep Space text in the Button style.
- **Hover:** gains the marigold `shadow-cta` glow. 150ms ease-out on background, shadow and translate.
- **Active:** fills with Core and moves down 1px.
- **Focus:** fills with Core, with a 2px Core outline at a 2px offset.
- **Busy:** the label changes ("Hosting…"), opacity drops to 70% and the cursor changes to wait.

### Chips (live runs)
A live-run chip is a submit button bound to the menu form.
- **Style:** Deep Space at 85%, a 1px Readout/15 border, square, min-width 208px, 10px × 16px padding. It has a two-column grid: the host's name (Title, 15px) over a meta line (racer count · phase), and an action word (Join / Spectate, 700 12px 0.2em uppercase, Readout Dim) spanning both rows on the right.
- **State:** on hover or focus the border and the action word turn Marigold. Focus adds a 2px Readout outline inset by 4px. A live phase (Racing, Results) sets its phase word in Readout White. Busy: 60% opacity and a wait cursor.
- **Heading:** "Live runs · N" in the Label treatment at 12px, led by a 6px pulsing square.

### Inputs / Fields
- **Style:** Deep Space fill, a 1px Readout/20 border, square, 44px tall, 14px side padding, Body type, Marigold caret, Readout Dim placeholder.
- **Hover:** the border rises to Readout/40.
- **Focus:** the border turns Marigold. There is no glow and no ring.
- **Label:** the Label style above the field, 6px gap.

### Ship Picker (signature)
The ‹ NAME › stepper is the one interaction the menu is built around.
- **Frame:** a Deep Space bar with a 1px Readout/20 border, 44px tall. It has two 40px chevron step buttons and the ship name centred between them (Title, uppercase, at least 12ch).
- **Legend:** "Ship" on the left and "Class · <name>" on the right (Meta tracking), on one Label line.
- **Steps:** the chevrons rest at Readout Dim and turn Readout White on hover or focus. Focus draws a 2px Readout outline inset 2px.
- **Change:** A/D, the arrow keys or a chevron cycles the ship. The 1px Marigold rule under the name sweeps in from the side of travel (`edge-sweep`, 320ms, cubic-bezier(0.16, 1, 0.3, 1)). The backdrop ship banks into the change on a damped spring.
- **Reduced motion:** the name swaps instantly. There is no sweep, no bank kick, no bob and no cruise drift. The asteroid, nebula and ship-bank motion in the scene also freeze.

### Key Hint
- **Style:** keycaps are square boxes, at least 24px, with a 1px Readout/25 border and 600 11px Readout White type. The action word follows in Meta. Pairs are 20px apart. It shows from `lg` up, at the right end of the strip.

### Menu Strip (signature)
The lower third itself: a full-width Space Grey bar with a 1px Readout/15 top edge and the upward `shadow-strip`. Padding is 16px × 20px, or 20px × 40px from `sm`. It holds the call sign, ship picker, primary and key hint on one 44px control line. Form errors appear below as 14px Readout White text and take no space when empty.

### Lobby (in-room)
The room before GO uses the same lower third over the live track. It shows the run, not the pitch.
- **Header:** the wordmark on the left and a ghost Leave on the right. Leave is square, 36px tall, with a Readout/25 border on Deep Space at 60%, and 600 12px 0.2em uppercase type.
- **Run title:** "Your run" for the host, "<host>'s run" for a guest. It is 700 uppercase, clamp(30px, 3.6vw, 46px), with `text-shadow-readout`. Below it are a 6px square Marigold dot, "Lobby · N racers" (600 12px 0.22em uppercase, Readout White) and the Copy-link chip.
- **Copy-link chip:** Deep Space at 85%, a 1px Readout/20 border, 32px tall. It shows "Copy link" plus the room path in Readout Dim. After a click it reads "Copied" until it loses focus. There is no timer.
- **Spec tag:** 17rem wide, on the strip's top edge. It has a Deep Space fill and a Readout/15 border with no bottom edge. It shows the class name (700 22px uppercase), a "Class" label and four stat rows. Each row is a label and a 4px bar with a Marigold fill. It is hidden below `sm`, where the ship legend shows the class instead.
- **Roster chips:** right-aligned in the same row, 20px above the strip. Each chip has a 10px square in the player's colour, the name (600 15px), word tags (YOU in Readout White, HOST or Spectating in Readout Dim, 700 11px 0.2em) and the ship name in Meta. Your own chip has a Readout/45 border. A disconnected racer is at 40% opacity with " · reconnecting". Below `sm` the row bleeds to the screen edge and scrolls sideways with no scrollbar.
- **Strip grid:** 17rem, auto, auto, then a flexible column from `lg`. The columns hold the ship picker, the colour swatches, the start control and the key hint.
- **Colour swatches:** 12 square 22px swatches in a 6×2 grid. The selected swatch has a 2px Readout White outline at a 2px offset. The swatch colours are the player palette in `game/colors.ts`, applied as inline background. They are not brand colours.
- **Start control:** the host sees the marigold Go button with a chevron. A guest sees "Waiting for <host>" (600 15px) over "The host starts the run" in Meta.
- **Keys:** A/D and the arrows cycle the ship. A bare Enter starts the run for the host only. The key hint shows [A D] Ship, plus [Enter] Go for the host.
- **Audio toggle:** hidden in the lobby, because it would sit over the strip. M still mutes.

## Do's and Don'ts

### Do:
- **Do** let the live game world be the hero. Keep the top of the screen open and put UI in the lower third.
- **Do** spend Marigold only on the element the player acts on. Use Core only for a pressed or focused primary.
- **Do** set all menu type in Chakra Petch through `font-readout`, and give type over the backdrop `text-shadow-readout`.
- **Do** keep every control on the 44px line, square-cut, with 1px Readout-alpha hairlines.
- **Do** reference `@theme` tokens for every colour, shadow and text shadow. A brand colour appears literally only in `app/app.css`.
- **Do** give every motion a reduced-motion state that stops it.

### Don't:
- **Don't** style the canvas with Tailwind, or add DOM panels that hide the world behind them.
- **Don't** round the corners of menu surfaces or controls.
- **Don't** add glass, backdrop-blur or cyan glow to a readout-world surface.
- **Don't** add a second warm accent or a second typeface to the menu.
- **Don't** use a raw hex or rgba in a `className`.
