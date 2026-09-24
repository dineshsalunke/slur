Agent: workerfour · Lane: results screen redesign #238 · Updated: 2026-09-24

## Goal

Redesign the PHASE.finished overlay (`game/overlays/results-overlay.tsx`) in the menu/lobby grammar of
`apps/client/DESIGN.md`, via impeccable. 1–2 comps first; build only after the owner picks.

## Done

- Issue #238 filed. Supervisor cleared the comps and the step-2 claims.
- Comps A "Timing board" and B "Winner card" sent to the supervisor for the owner. Files are in this
  session's scratchpad `comps/` (`comp.html?v=a|b&host=1|0`, plus 4 PNGs: desk host, mob guest).

## State

- `results-overlay.tsx` is a centred HudPanel with cyan heading/rows + HudButton (off-grammar).
- Data available without server change: rank, name, colorId, shipId, finishTime, dnf (`useRunView`,
  `computeStandings`).
- Server sets PHASE.finished only when all racers finish or the deadline hits.
- Both comps: strip = "Your finish" + host "Race again" (marigold) + [Enter] hint; guest "Waiting for
  <host>". Times as m:ss.00, gap +s.ss.

## Uncommitted

None.

## Held files

Cleared for step 2: `game/overlays/results-overlay.tsx`, new results leaves, results tests in
`game/overlays/overlays.test.tsx`, the DESIGN.md "Results" section.
Not mine: `leave-button.tsx`, `audio-toggle.tsx` (workertwo). `overlays.tsx` is unheld; ask before editing.

## Next

1. Wait for the owner's pick and answers (A/B, copy, Enter = Race again, row stagger).
2. Build per NN #13 (mechanism weighing goes in the commit/PR body), tests, headless check desk + 390.
3. Finish review (impeccable-finish-reviewer), then the DESIGN.md "Results" section.

## Open questions

- Hide AudioToggle in PHASE.finished (overlays.tsx edit) — asked the supervisor.
- Hand-off with workerone's hosted ending effect — the supervisor is relaying it.
- Delete `game/net-debug-hud.tsx` (owner must run `git rm` or allow it). Carried over.

## Lessons → memory

none
