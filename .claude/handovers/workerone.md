Agent: workerone · Lane: RFC-349 F2 tug pilot (#390) — claim + D1–D3 sent, waiting · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#390: move tug into `packages/shared/src/features/tug/` + `apps/client/app/features/tug/`, cut its lines
from central files, measure per RFC §3.8. No behaviour or wire change. F3 = owner go/no-go on the numbers.

## Done

- F1 #385: `1a5415c7` (sim) + `f912f7ab` (client). Not pushed; close #385 after the owner pushes.
- Filed #390. Sent the supervisor the claim list and decisions D1–D3.

## State

- Footprint measured (`rg -il tug`, tests excluded): 35 files.
- D1: tug's 4 PlayerState fields sit at indexes 33–36 of 45 (`player-fields.ts:47–50`), mid-core. Moving
  them into the feature spread changes wire order. Recommended: keep them in core for F2.
- D2: 20 tug SimConfig keys + 8 Rules dials wait for S6 `defineRules`. Recommended: leave them until S6.
- D3: keep `HeldPower.tug = 8` and the test-level grant central.
- Order risk: `stepTugThrows` runs inside `stepCombat` (run/combat.ts:104) between mines and portals;
  `features.tick` runs at run-sim.ts:135.
- Engine slots F2 needs: sim `ship.input`, `ship.clear`, `power.bagWeight(cfg)`; client `net`,
  `views.scene`, `views.pickups`, `hud.glyph`, `audio`.

## Uncommitted

- none.

## Held files

- none yet. Claim pending with the supervisor (see the message sent 2026-09-29).

## Next

1. Wait for the supervisor to clear the claim and relay the D1–D3 answers.
2. Measure baselines first: `step()` time per tick (Chrome, CDP throttle) and /test-level frame time
   (perf-analysis skill).
3. Sim half, then client half, then the §3.8 numbers. Fly /test-level headless (DPR 1, muted, kill after).

## Open questions

- D1, D2, D3 (owner, via the supervisor). Push timing (owner).

## Lessons → memory

- none.
