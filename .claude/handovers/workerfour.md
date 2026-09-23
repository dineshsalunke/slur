Agent: workerfour · Lane: main-menu rework (no issue; the owner waived it) · Updated: 2026-09-24 ~02:05

## Goal

Rework the main menu (`/`) into the approved "Broadcast lower third" over the live game world, with the
impeccable skill. The build ends with the finish review, then DESIGN.md.

## Done

- `f23ef50` feat(menu): lower third, ship picker, key hint, room chips, clientAction host/join that sends
  `SET_CLASS_MESSAGE`, game-scene backdrop, palette tokens. Also commits `PRODUCT.md`, `.impeccable/**`
  and the review captures.
- `6c5a61d` memory: check-the-cdp-port-is-yours (plus workerthree's MEMORY.md line).
- Backdrop prototypes were reported to the supervisor. (b) game-scene was chosen and accepted.

## State

- Prototypes: (a) lean was 24 draws at 0.3 ms JS median. (b) game was 37 draws at 0.6 ms. The old menu
  was 13, `/test-level` is 116.
- The supervisor accepted 37 draws, which is 2.8x the old menu and past my own "about 2x" bar, because
  (a) fails PRODUCT.md principle 2.
- Final build: 37 to 43 draws, 0.6 to 1.0 ms JS median, across runs. The spread is [unmeasured cause];
  I suspect the monoliths in view.
- End to end on a private stack: the A key picked bob, Enter hosted, and the server player had
  `shipId: "bob"` and `name: "Tester"`. A second tab showed the chip "Tester's run".
- No horizontal scroll at 390px. The impeccable detector found nothing. 244 vitest tests pass. The build
  passes. Lint is clean for `apps/client`. The repo-wide biome errors all come from the untracked
  `.claude/skills/`.
- Finish review verdict: **ship-after-fixes**. Applied: 1 (Enter on body submits), 2 (error text is not
  core), 3 partial (portrait camera pitch), 5 (chip focus ring inset), 7 (flat keycaps).
- The monolith far-seam flicker is workerthree's. Do not work around it in the menu.

## Uncommitted

None of mine. `.claude/agents/`, `.claude/skills/` and `packages/shared/src/pacing/` are not mine.

## Held files

`routes/home.tsx`, `routes/home/*`, `ui/button.tsx`, `ui/scrim.tsx`, `lobby/room-list.tsx`, `app.css`
(tokens only). `ui/panel.tsx` was deleted.

## Next

Supervisor order on resume (seam ack after 1a10a53):

0. FIRST: draft replacement copy for the "share the code" pitch and the "LIVE RUNS · 0" label. Send
   the drafts to slur-supervisor. Build nothing for this until the owner approves.
0b. The claim on `game/scene/rock-field.tsx` and `asteroid-band.tsx` for reduced motion is CLEAR. Do
   item 3 below after the drafts.

Then, in this order:

1. Fix 6: find out why the menu ship shows no exhaust plume or engine glow. `exhaustDrive` should read
   0.6: `Sim.vz = maxCruise * 0.6` in `landing-rig.tsx`. Check the `ExhaustField` query `Render, Net`
   and `exhaustPorts(shipId)`. Also check whether the fixed-step rig ordering zeroes it.
2. Fix 3, rest: on mobile the ship still sits behind the headline
   (`.impeccable/review/mobile.png`). Options: push the ship higher, or shrink the headline on portrait.
3. Fix 4 (asteroids ignore reduced motion) is in `game/scene/rock-field.tsx:41-43` and maybe
   `asteroid-band.tsx:54`. These are not my files. Ask the supervisor for a claim or hand it on.
4. Run the `impeccable-finish-reviewer` again for a short confirm round, then the
   `impeccable-documenter` for `apps/client/DESIGN.md`, and commit it by pathspec.

## Open questions

- Owner (copy, not changed): the pitch says "share the code", but there is no room code. The empty state
  says "send your crew the link". "LIVE RUNS · 0" repeats the "No runs yet" line. The class name
  ("COMET") above the picker can read as a second ship name.
- Supervisor: a claim on `rock-field.tsx`/`asteroid-band.tsx` for reduced motion, or give it to the
  owner of that lane.

## Lessons → memory

`.claude/memory/check-the-cdp-port-is-yours.md` (6c5a61d).
