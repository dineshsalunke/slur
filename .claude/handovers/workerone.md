Agent: workerone · Lane: RFC-349 F2 tug pilot (#390) — answers in, baselines taken, build not started · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#390: move tug into `packages/shared/src/features/tug/` + `apps/client/app/features/tug/`, cut its lines
from central files, measure per RFC §3.8. Tug pull must feel the same. F3 = owner go/no-go on the numbers.

## Done

- F1 #385 closed (1a5415c7 + f912f7ab, both on origin/dev).
- Filed #390. Claim CLEARED by the supervisor. No overlap with workertwo #388 or workerthree #389.
- Baselines taken on the unchanged tree (HEAD c99945c4). See State.

## Owner answers (2026-09-29, via the supervisor)

- **D1 = B.** Move the 4 fields (`tugTimer`, `slowTimer`, `towTimer`, `tugAnchorZ`, now at
  `player-fields.ts:47–50`, indexes 33–36) into tug's `fields.player` spread. The wire order changes once.
  Update the golden test in `player-fields.test.ts`. The commit body says the order changed on purpose.
  **The proof is required before commit:** 2 real SDK-joined clients (memory `node-bots.md`,
  `deprecated-breaks-reflection-decoding.md`; `room.state` tests are blind), zero `field not defined` /
  `definition mismatch` logs, and tug pull works end to end.
- **D2 = a.** The 20 tug SimConfig keys (`sim-config.ts`), 8 dials (`dev/tuning-schema.ts:122–129`) and
  8 getters (`routes/test-level/tuned-sim-config.ts`) stay until S6.
- **D3 = keep central.** `HeldPower.tug = 8` (`combat/constants.ts:39`) and the grant entry
  (`routes/test-level/pickup-grants/pickup-grants.constants.ts:10`) stay.
- Add to `conventions/features.md` §4: wire order is not append-only across F-stages. The client decodes
  by reflection, and both ends must deploy together. Rules 1–3 of §4 need rewording to match.
- Keep `stepTugThrows` in the same in-tick order (inside `stepCombat`, `run/combat.ts:104`, after
  `stepMines`, before `stepPortals`) unless the determinism tests prove the order does not matter.

## State

- Baseline /test-level frame (GPU-synced readPixels median, DPR 1, 1728×1080, `?quality=high`, ArrowUp
  held, warm-up + 3 loads): **9.20, 9.00, 8.30 ms, best 8.30; draws 74**. The ship drove to z≈265.
- Baseline `simulate()` per tick in Chrome, 4× CDP CPU throttle, real `room.sim.track`, executioner,
  20000 ticks × 5, median: **idle 2.36–2.39 µs, tug-active 2.36–2.41 µs** (3 loads).
- Driver: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/26f15f50-2b08-477f-a34a-597637b468fc/scratchpad/f2-perf.mjs`
  (`MODE=frame|step`, `REPS`). Rerun it after the change, back to back. The step loop sets `s.tugTimer`
  directly, so it survives the move. It imports `@slur/shared` from the page's `/@fs/.../dist/index.js`.
  Copy it to the new session's scratchpad if `/private/tmp` is cleared.
- Footprint (`rg -il tug`, tests excluded): 35 files. §1.8 target: 19 central → ≤ 2 registry lines.
  Expected after F2 with D2/D3: sim-config.ts, tuning-schema.ts, tuned-sim-config.ts, combat/constants.ts,
  pickup-grants.constants.ts + the 2 registries. That is 7, not ≤ 2. Report it plainly.
- workertwo added `DIAL_SYNC_SYSTEM` to `net-loop.constants.ts`. That file is not in my claim.

## Plan (decided; build in this order)

Sim half (`packages/shared/src/features/tug/`):
1. Move `combat/tug.ts`, `combat/tug-constants.ts`, `run/tug-run.ts`, `sim/tug-status.ts` and their 3
   tests (`git mv` is denied when scripted: memory `bulk-move-without-git-mv.md`). Fix imports.
2. Split `tickStatus`/`clearStatus`: stun, boost and glide stay core in `step.ts` (or a core status file);
   the tug, slow and tow parts become tug `ship.tick` and a new `ship.clear` hook.
3. New sim slots: `ship.input` (towedInput; applied before thrust, after the stun NEUTRAL swap at
   step.ts:422), `ship.clear`, `power.bagWeight` as `( cfg ) => number` (power-bag.ts:30,92 read
   `cfg.tugRatio`; the bag cache key must still include it).
4. `tug.feature.ts`: `fields.player` (the 4 fields, same specs), `ship` hooks, `run` hooks (open → throws
   array; `use` → fireTug; `tick` → stepTugThrows; `reset` → clear), `messages: [ TUG_MESSAGE ]`,
   `power: { kind: HeldPower.tug, … }`. The run hooks need `pickups`/`shieldAbsorbs` from FireContext:
   check `RunContext` covers what `fireTug`/`stepTugThrows` read, and extend it if not.
5. Order: `stepTugThrows` must stay between `stepMines` and `stepPortals`. Either add a run-hook phase
   there, or show determinism tests hold with `features.tick` where it is (run-sim.ts:135).
6. Remove tug lines from step.ts, sim/types.ts (spawnShip lists the fields: take defaults from
   PLAYER_FIELDS or the feature), run-sim.ts, run/combat.ts, power-bag.ts, player-fields.ts, index.ts.
   Register in `features/registry.ts`. Keep `@slur/shared` exporting what the client and server still
   import (TUG_MESSAGE, TugEvent, …) via the feature contract or a tug export line.

Client half (`apps/client/app/features/tug/`):
7. Move `game/scene/tug-events.ts`, `tug-line/*`, `tug-pickups/*`. `tug.client.ts`: `sim`, `net`
   (pushTug + the audio handler from `audio/bind-room-audio.ts:184`), `views.scene` (TugLine),
   `views.pickups` (TugPickups; new slot consumed in `pickup-field.tsx` + `seeker-pickups.utils.ts`
   layout by power kind), `hud.glyph` (`glyph-atlas.ts:103`), `audio`.
8. Remove the hand mounts: `net-canvas.tsx` `<TugLine />`, `attach-room-to-world.ts` TUG_MESSAGE,
   `pickup-field.tsx`, `seeker-pickups.tsx` `tugs` field.

Proof and gates:
9. `pnpm typecheck`, `pnpm test`, `pnpm lint`. The golden test updated on purpose.
10. The D1 proof (2 SDK clients, zero decode errors, tug pull works). A new unit test shuffles the registry
    and gets the same schedule.
11. Fly /test-level headless: fire tug (`room.send('usePowerUp', { slot: 0, dir: 1 })`, memory
    `step-the-loopback-room-by-hand.md`, `stage-*`), and compare the pull to before.
12. Rerun `f2-perf.mjs`. Report §3.8: central count, wire, step µs, frame ms, determinism, order test.
13. Docs: RFC §3.8 numbers + §7 F2 row, `conventions/features.md` §3 slots + §4 wire note.
14. Commit by pathspec. Comment the SHAs and §3.8 numbers on #390. Close it only after the owner's push.
    F3 (go/no-go) is a separate stage.

## Uncommitted

- none.

## Held files (claim cleared)

- Shared: `combat/tug.ts`, `combat/tug-constants.ts`, `run/tug-run.ts`, `sim/tug-status.ts` (+ 3 tests),
  new `features/tug/*`, `features/registry.ts`, `features/define-sim-feature.ts`, `features/sim-hooks.ts`,
  `sim/step.ts`, `sim/types.ts`, `run/run-sim.ts`, `run/combat.ts`, `combat/power-bag.ts`, `index.ts`,
  `player-fields.ts` (+ test).
- Client: `game/scene/tug-events.ts`, `game/scene/tug-line/*`, `game/scene/tug-pickups/*`, new
  `features/tug/*`, `features/client-features.ts`, `engine/*`, `net/attach-room-to-world.ts`,
  `game/net-canvas.tsx`, `game/scene/pickup-field.tsx`, `game/scene/seeker-pickups/*`,
  `game/scene/power-arc/glyph-atlas.ts`, `audio/bind-room-audio.ts`.
- Tests (import paths only): server `room-tug.test.ts`, `room-mine-fizzle.test.ts`. Shared `combat.test`,
  `power-bag.test`, `director.test`, `portal-run.test`, `seeker-pickups.test`. Client
  `pickup-instances.test`, `seeker-pickups.test`, `pickup-grants.utils.test`.
- Docs: `docs/RFC-349-ARCHITECTURE.md` §3.8/§7, `conventions/features.md`.

## Next

1. Plan step 1.

## Open questions

- none. D1–D3 answered.

## Lessons → memory

- `.claude/skills/perf-analysis/scripts/perf.mjs` still holds `KeyW`, but throttle is `ArrowUp` since #368.
  A run with `KeyW` measures a parked ship. Recorded here only. The skill file is a fix for its owner, not
  a memory.
