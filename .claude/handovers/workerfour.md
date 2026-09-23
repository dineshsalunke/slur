Agent: workerfour · Lane: main-menu rework (no issue, waived) → next: in-room ship pick (no issue) · Updated: 2026-09-24 ~02:40

## Goal

Finish the main-menu rework (`/`) with the finish review and `apps/client/DESIGN.md`. Then design and build
the in-room ship-pick screen, which the owner approved: comps first, build only after the owner picks one.

## Done

- `f23ef50` menu lower third (previous seam).
- `303946f` reduced motion: RockField holds `uRockTime` at 0, and `prefersReducedMotion` moved to
  `game/scene/reduced-motion.ts`. Portrait: the ship flies 15u ahead (`PORTRAIT_AHEAD`) and the camera
  looks at y −12.
- `1f1eb0b` owner copy: pitch "send your crew the link", "Live runs" hides the count at 0, empty line
  "Nobody's racing yet. Be the first.", picker label "Class · <name>".
- `2eed852` memory: narrow-headless-captures-need-cdp-viewport.
- `12ca208` NebulaBaker holds the live `uTime` at 0 under reduced motion. This closes the last finish-review
  fix. Reduced-motion A/B 4 s apart matches by eye, nebula included.

## State

- Finish review confirm round: disposition **fix**. Fixes 1, 2, 3, 5 and 7 are resolved. Fix 6 (plume)
  won't be fixed: only split-crown has port data in `game/scene/exhaust-ports.ts`, and the owner parked it.
  Copy is verified on desktop and mobile. No regressions.
- The one remaining fix (the nebula ignored reduced motion) landed in `12ca208`. The menu has no open
  review fixes. A final confirm round is optional; the reviewer's condition was only that fix.
- Valid captures (CDP `setDeviceMetricsOverride`, script `scratchpad/cap.mjs`, gone after the session):
  at 390×844 the ship is at y≈270 and the headline at ≈355. Reduced-motion A/B 4 s apart: the asteroids
  hold still.
- 244 vitest pass. Client tsc is clean except `routes/pacing/route.tsx`, which belongs to another lane.
- A shared `/game/:id` link redirects to `/` when there is no session room (`routes/game/route.tsx:13-14`).

## Uncommitted

None of mine. `routes.ts`, `packages/shared/src/pacing/*`, `routes/pacing/`, `.claude/agents|skills/` are
other lanes'.

## Held files

Menu: `routes/home.tsx`, `routes/home/*`, `ui/button.tsx`, `ui/scrim.tsx`, `lobby/room-list.tsx`,
`app.css` (tokens), `game/scene/rock-field.tsx`, `game/scene/reduced-motion.ts`,
`game/scene/nebula-baker.ts` (the reduced-motion claim only; release it at will).
Ship-pick lane (CLEAR from the supervisor): `game/overlays/lobby-overlay.tsx`, `roster.tsx`, `ship-card.tsx`,
`overlays.test.tsx`, `game/net-canvas.tsx`, the move of `routes/home/ship-picker.tsx` + `ship-choice.ts`,
`routes/game/route.tsx`, `net/matchmaking.ts`.

## Next

1. (done, 12ca208)
2. Run `impeccable-documenter` → `apps/client/DESIGN.md` (+ sidecar). Commit by pathspec.
3. In-room ship pick (owner-approved plan):
   - Redesign `game/overlays/lobby-overlay.tsx` (PHASE.lobby only) in the menu's lower-third grammar.
     Bottom strip: [ship picker ‹ NAME › + "Class · X" + SPD/AGI/ARM/EVA bars] [colour swatches]
     [GO for host / "Waiting for <host>"] [key hints]. The roster becomes chips above the strip.
   - Run impeccable shape → 1–2 comps → send them to the supervisor. **Build nothing until the owner
     picks.**
   - Build: move ship-picker/ship-choice to a shared place. In-room picks go through ship-choice (writes
     `slur:ship`) and send SET_CLASS. Keys: 1–5 exist (`net-canvas.tsx:47`). Check whether lobby-phase
     A/D strafe does anything before reusing A/D.
   - Deep link (owner chose option a): in the `routes/game/route.tsx` clientLoader, when there is no
     session room, join by id with the saved name + ship (no useEffect; the room stays on the `session`
     singleton). On a closed or unknown id, redirect to `/` with the error line. The saved ship must also
     be applied on arrival by link.
   - Rules: SET_CLASS/SET_COLOR only in PHASE.lobby (`run-room.ts:92,97`). Pickers disable outside
     lobby. GO is host-only. Late joiners spectate.
   - Then finish review → update DESIGN.md.

## Open questions

- None open. The exhaust plume for 4 ships is parked by the owner.

## Lessons → memory

`.claude/memory/narrow-headless-captures-need-cdp-viewport.md` (2eed852).
