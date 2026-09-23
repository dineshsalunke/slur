Agent: workerfour · Lane: in-room ship pick (no issue, waived) · Updated: 2026-09-24 ~03:20

## Goal

Design and build the in-room ship-pick screen (the PHASE.lobby overlay), which the owner approved: comps
first, build only after the owner picks one.

## Done

- Menu rework closed: `f23ef50`, `303946f`, `1f1eb0b`, `12ca208` (see git log for the previous seams).
- `9b97078` `apps/client/DESIGN.md` + `.impeccable/design.json`, recorded by impeccable-documenter from
  the shipped menu. `a894141` biome-formats the sidecar.
- Comps A (one strip) and B (spec tag) sent to the supervisor for the owner (msg ef9de9aa).

## State

- Comps: `scratchpad/comps/comp-{a,b}{1,0}-{desk,mob}.png` (1 = host, 0 = guest) in session scratchpad
  `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/5ce59634-0c3a-4eba-b703-6f7eb9f5954f/`.
  Source `comp.html` beside them. The scratchpad may not survive; the design is described in the msg.
- Lobby-phase A/D is free: `game/net-loop.tsx:16-18` runs `netFlightSystem` only when phase is racing.
- Keys 1–5 send SET_CLASS in any phase (`net-canvas.tsx:47`); the server drops it outside lobby
  (`run-room.ts:92`). Keys 1–3 are also power slots, which the server drops outside racing.
- Stat fills are real: Challenger SPD23 AGI58 ARM57 EVA76 (ShipCard formula over SHIP_CLASSES).
- DESIGN.md lists drift it did not canonize: `ui/hud-panel|hud-button|tag` (rounded, cyan, glass), the
  stale `app.css` header comment, and `root.tsx` body system-sans.
- No headless Chrome or dev server of mine is running.

## Uncommitted

None of mine.

## Held files

Menu (release at will): `routes/home.tsx`, `routes/home/*`, `ui/button.tsx`, `ui/scrim.tsx`,
`lobby/room-list.tsx`, `app.css` (tokens), `game/scene/rock-field.tsx`, `game/scene/reduced-motion.ts`.
Ship-pick lane (CLEAR from the supervisor): `game/overlays/lobby-overlay.tsx`, `roster.tsx`, `ship-card.tsx`,
`overlays.test.tsx`, `game/net-canvas.tsx`, the move of `routes/home/ship-picker.tsx` + `ship-choice.ts`,
`routes/game/route.tsx`, `net/matchmaking.ts`. `apps/client/DESIGN.md` + sidecar (CLEAR).

## Next

1. Wait for the owner's pick (A or B) and answers on: Copy link chip, Enter = GO for host, HOST word tag.
2. Build to the pick:
   - Move ship-picker/ship-choice to a shared place. In-room picks go through ship-choice (writes
     `slur:ship`) and send SET_CLASS. A/D cycles in lobby. Pickers disable outside lobby. GO host-only.
   - Deep link (owner option a): `routes/game/route.tsx` clientLoader joins by id with saved name + ship
     when there is no session room (no useEffect; room stays on the `session` singleton). Closed/unknown id
     → redirect `/` with the error line. Apply the saved ship on arrival by link.
3. Finish review → update DESIGN.md with the lobby surface.

## Open questions

- For the owner: A vs B; Copy link chip; Enter = GO; ★ → HOST tag.

## Lessons → memory

none (a biome check piped through `tail` hides its exit code; too small for a memory).
