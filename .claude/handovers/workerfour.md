Agent: workerfour · Lane: in-room ship pick, comp B (no issue, waived) · Updated: 2026-09-24 ~03:45

## Goal

Build the in-room ship pick (PHASE.lobby overlay) to comp B, the spec tag, which the owner picked. The owner
also approved: a Copy-link chip, Enter = GO for the host, a HOST word tag in place of ★, and the deep-link
join (option a).

## Done

- `9b97078` + `a894141` `apps/client/DESIGN.md` + `.impeccable/design.json` (menu system).
- `efd671f` step 1: `ship/` (ship-choice moved, ship-stats, ship-keys, ship-stepper), `ui/` (chevron,
  field-label, key-hint with a `hints` prop). matchmaking `enter()` sends SET_CLASS with `currentShip()`
  on host and join, and `joinByLink()` dedupes by id. The `routes/game` clientLoader joins by link, and a
  failure redirects to `/?run=closed`. The home loader returns `notice`, which MenuError shows. The dev
  1–5 keys are removed from net-canvas. The lobby overlay is the OLD panels, with ShipStepper in place of
  the ship cards (interim).

## State

- 241/244 vitest pass. The 3 failures are `bounce-spark.test.ts` (workerthree's uncommitted bounce work
  against an unrebuilt shared dist). tsc shows errors only in those bounce files. Lint scripts pass.
- Deep link is NOT browser-tested yet [unmeasured]: open `/game/<id>` in a fresh tab while a room exists,
  and again with a bad id.
- Comp B spec (the comp is in the msg to the supervisor; images in the old session scratchpad
  `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/5ce59634-0c3a-4eba-b703-6f7eb9f5954f/scratchpad/comps/comp.html`
  may be gone):
  - Scrim (`ui/scrim`). Header: SLUR top-left, Leave top-right (a quiet square-cut ghost: border
    readout/25, bg deep/60, 600 12px 0.2em uppercase, h-9).
  - Lower area, left: h2 "Your run" (host) / "<host>'s run" (guest), clamp(30px,3.6vw,46px) 700 uppercase
    with text-shadow-readout. Below it: a 6px square dot + "Lobby · N racers" (label style 12px) and a
    Copy-link chip (deep/85, border readout/20, "Copy link" + a dim path; on click write location.href
    to the clipboard, and the label reads "Copied" until blur, with no timer).
  - Row above the strip: the spec tag on the left, 17rem wide, sitting on the strip's top edge
    (bg deep, border readout/15, no bottom border). It shows the class name 22px 700 uppercase + "Class"
    label, and 4 rows of `label | 4px bar` with marigold fill = `statFill(i, shipClass)`. The roster chips
    sit right-aligned in the same row, 20px above the strip.
  - Roster chip: 10px colour square, name 15px 600, word tag (YOU readout / HOST dim, 11px 700 0.2em),
    ship name 12px uppercase dim. YOU gets border readout/45. Disconnected: opacity 40 + " · reconnecting".
    Spectating: tag "Spectating".
  - Strip (bg space, border-t readout/15, shadow-strip, the menu's px/py): grid
    `17rem auto auto 1fr`: ShipStepper (classLegend `sm:invisible`, since the tag carries the class),
    Colour (12 square 22px swatches, 6×2, selected = outline-2 readout offset-2, send SET_COLOR_MESSAGE),
    StartControl (host: marigold Button "Go" + Chevron sends START_MESSAGE; guest: "Waiting for <host>"
    15px 600 + "The host starts the run" meta), KeyHint [A D Ship] (+ [Enter Go] for the host).
  - Mobile (<sm): tag hidden, the legend shows the class, chips scroll sideways, key hint hidden.

## Uncommitted

None of mine. (The bounce-spark, hit-spark and attach-room-to-world changes are workerthree's.)

## Held files

Ship-pick (CLEAR): `game/overlays/lobby-overlay.tsx`, `roster.tsx`, `leave-button.tsx`, `overlays.test.tsx`,
new leaves `room-title.tsx`, `copy-link.tsx`, `spec-tag.tsx`, `lobby-ship-picker.tsx`,
`colour-swatches.tsx`, `start-control.tsx`; `game/net-canvas.tsx`, `routes/game/route.tsx`,
`net/matchmaking.ts`, `ship/*`, `ui/key-hint|chevron|field-label.tsx`. Menu files as before.
NOT mine: `net/attach-room-to-world.ts` (workerthree).

## Next

1. Build the comp-B leaves listed above. Each leaf subscribes itself (`useRunView(room)` or
   `useShipChoice()`), and LobbyOverlay holds none. LobbyShipPicker: one window keydown effect.
   `stepOf(e)` → `cycleShip` + `room.send(SET_CLASS_MESSAGE, currentShip().id)`. `isBareEnter(e)` and
   `room.state.hostId === room.sessionId` → START_MESSAGE. Disable the pickers when
   `room.state.phase !== PHASE.lobby`.
2. LeaveButton: add a `tone: 'hud' | 'ghost'` prop, and use ghost in the lobby.
3. Rewrite roster.tsx as chips (no ★ glyph, no Tag/ColorDot).
4. Run biome/tsc/vitest/lint scripts, then headless-verify at 1440×900 and 390×844 (a hosted room on :5173,
   CDP port 9333, DPR 1, mute; kill after). Include deep-link good and bad id.
5. Commit, finish review (impeccable-finish-reviewer), then update DESIGN.md with the lobby surface.

## Open questions

- none.

## Lessons → memory

none this seam. (`git add` of a deleted path fails; commit the rename by pathspec instead. It is too small
for a memory.)
