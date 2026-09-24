Agent: workerfour · Lane: results screen redesign #238 · Updated: 2026-09-24

## Goal

Redesign the PHASE.finished overlay (`game/overlays/results-overlay.tsx`) in the menu/lobby grammar of
`apps/client/DESIGN.md`, via impeccable. 1–2 comps first; build only after the owner picks.

## Done

- Issue #238 filed.
- Plan + claims sent to slur-supervisor (comps A "Broadcast standings", B "Podium card").

## State

- `results-overlay.tsx` is a centred HudPanel with cyan heading/rows + HudButton (off-grammar).
- Data available without server change: rank, name, colorId, shipId, finishTime, dnf (`useRunView`,
  `computeStandings`).
- Server sets PHASE.finished only when all racers finish or the deadline hits.

## Uncommitted

None.

## Held files

None yet. Claimed for step 2 (pending clearance): `game/overlays/results-overlay.tsx`, new results leaves,
`game/overlays/overlays.test.tsx`, `apps/client/DESIGN.md`.
Not mine: `leave-button.tsx`, `audio-toggle.tsx` (workertwo), `overlays.tsx` (workerone).

## Next

1. Wait for supervisor clearance and workerone's answer on the ending → results hand-off.
2. Load impeccable, make 2 comps in the scratchpad, publish for the owner.
3. After the pick: build, test, headless check, DESIGN.md "Results" section.

## Open questions

- Hand-off with workerone's hosted ending effect (asked via supervisor).
- Delete `game/net-debug-hud.tsx` (owner must run `git rm` or allow it). Carried over.

## Lessons → memory

none
