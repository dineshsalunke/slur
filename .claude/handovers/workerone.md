Agent: workerone · Lane: RFC-349 F2 tug pilot (#390) — sim half built + green, UNCOMMITTED; client half not started · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#390: move tug into `packages/shared/src/features/tug/` + `apps/client/app/features/tug/`, cut its lines
from central files, measure per RFC §3.8. Tug pull must feel the same. F3 = owner go/no-go on the numbers.

## Owner answers (2026-09-29) — unchanged

- **D1 = B.** The 4 fields move into tug's `fields.player` (DONE, uncommitted). Wire order changed on purpose.
  **Proof is required before commit:** 2 real SDK-joined clients (memory `node-bots.md`,
  `deprecated-breaks-reflection-decoding.md`), zero `field not defined` / `definition mismatch` logs, tug
  pull works end to end. The commit body must say the order changed on purpose.
- **D2 = a.** 20 SimConfig keys, 8 dials, 8 getters stay until S6. **D3 = keep central** (`HeldPower.tug`,
  grant entry).
- Add to `conventions/features.md` §4: wire order is not append-only across F-stages; client decodes by
  reflection; both ends deploy together. Reword §4 rules 1–3.

## Done

- F1 #385 closed (1a5415c7 + f912f7ab).
- Claims: original set CLEARED; `sim-config.ts` (import line) + new `sim/status.ts` CLEARED 2026-09-29.
- **net-canvas.tsx RELEASED to workertwo** (I had not edited it). Re-claim it from the supervisor after
  workertwo commits its QualityStepDown lines, then make the tug cut on top.
- Sim half built (uncommitted, see below).

## State (measured this session)

- Shared `pnpm test`: **578/578 pass**. Server `pnpm typecheck` clean, `pnpm test` **99/99 pass**
  (incl. `room-tug.test.ts`). Shared `tsc -b` clean. Client typecheck/test/lint NOT run yet.
- New `PlayerState` wire order: 39 fields; tug fields at **35–38** (after `progressAt`). Golden test
  updated (`player-fields.test.ts`).
- Every shared dist entry loads alone with no TDZ error (index, step, schema, registry, player-fields,
  types, power-bag, combat-step, run-sim, tug.feature, run-features, sim-config).
- `bagCounts()` unchanged: bolt 4, seeker 3, mine 3, boost 3, shield 3, portal 2, tug 2.
- Baselines (before the change, HEAD c99945c4): frame **8.30 ms best (9.20/9.00/8.30), draws 74**;
  `simulate()` **idle 2.36–2.39 µs, tug-active 2.36–2.41 µs**. Driver copied to this session's
  scratchpad: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/577d58ec-4a20-4ffa-b324-3926e925bdda/scratchpad/f2-perf.mjs`
  (`MODE=frame|step`, `REPS`). If `/private/tmp` is cleared, recover from the older scratchpad path in
  the previous handover version.

## Design decisions taken this session (put them in the PR/commit body and RFC §3.8)

1. **Import-cycle rule.** The registry is read at module-eval time by `player-fields.ts` (schema) and
   `sim-hooks.ts` (step). A sim half that value-imports heavy core (`combat-step` → `mine` → `step`;
   `run/combat` → `schema`) closes a cycle and throws `Cannot access 'SIM_FEATURES' before
   initialization` on some entry orders (measured). So the sim half value-imports **leaf modules only**;
   engine services come in via `RunContext`.
2. `RunContext.shieldAbsorbs( v, at )` added (bound in `run-sim.ts` to `shieldAbsorbs(…, broadcast)`).
3. `run.use` now returns **boolean = fired**; the engine calls `spendPower` on `true`. `openRunFeatures`
   moved to new `features/run-features.ts` (imports `combat-step`; only `run-sim` uses it).
4. New sim slots: `ship.input` (fold, applied to the post-stun input; `towedInput`), `ship.clear`
   (`clearTugStatus`; called after core `clearStatus` in `markDead`/`respawn`), `power.bagWeight( cfg )`
   (power-bag appends feature weights after portal, and to the cache key). `PowerSpec.kind` is `HeldPower`.
5. `tugFeature` is annotated `SimFeature< typeof TUG_FIELDS >` — inference made a type cycle
   (`PLAYER_FIELDS` → `SimShip` → hook params).
6. Core stun/boost/glide status → new `sim/status.ts` (not exported from index; nobody outside used it).
7. `index.ts` exports only `features/tug/tug.feature.js` (re-exports `TUG_MESSAGE`, `TugEvent`,
   `TugOutcome`) + `features/run-features.js`. `pullEase`, `catapult`, etc. are no longer public.
8. `spawnShip` spreads `FEATURE_SHIP_DEFAULTS` (new in `player-fields.ts`, built from feature sim fields).
9. Float order kept: thrust `boost + (0 + tug)`, cap `featureCap( boostCap )`, tick core → tug. Same as before.

## Uncommitted (all mine, sim half — commit only after the D1 proof)

- New: `packages/shared/src/features/tug/{tug.ts,tug-constants.ts,tug-run.ts,tug-status.ts,tug.feature.ts,tug.test.ts,tug-run.test.ts,tug-status.test.ts}`,
  `packages/shared/src/features/run-features.ts`, `packages/shared/src/sim/status.ts`.
- Deleted (moved): `combat/tug.ts`, `combat/tug.test.ts`, `combat/tug-constants.ts`, `run/tug-run.ts`,
  `run/tug-run.test.ts`, `sim/tug-status.ts`, `sim/tug-status.test.ts`. Untracked new files need
  `git add <exact paths>` first (pathspec commit skips untracked — memory `shared-tree-footguns.md`).
- Modified: `features/define-sim-feature.ts`, `features/sim-hooks.ts`, `features/registry.ts`,
  `player-fields.ts`, `player-fields.test.ts`, `sim/types.ts`, `sim/step.ts`, `sim-config.ts`, `index.ts`,
  `run/combat.ts`, `run/run-sim.ts`, `run/portal-run.test.ts`, `combat/power-bag.ts`,
  `apps/server/src/rooms/room-mine-fizzle.test.ts`.
- The owner's running `pnpm dev` already serves these edits (shared tsc-watch).

## Held files

- As in the previous handover, minus `apps/client/app/game/net-canvas.tsx` (released to workertwo).

## Next

1. **Order check (plan step 5).** `stepTugThrows` used to run inside `stepCombat` after `stepMines`,
   before `stepPortals`/`stepPickups`/`mirrorBreaks`. It now runs in `features.tick` after `stepCombat`
   (`run-sim.ts` fixedStep). Inferred order-independent (latch mutates vz/timers/shield; portals and
   pickups do not read those) — **prove it**: add a test, or add a combat-phase run hook. Note broadcast
   order within a tick changes (tug messages now after pickup/portal messages).
2. Add `features/registry.test.ts`: imports `./registry.js` FIRST (catches the TDZ cycle — node:test runs
   each file in its own process), and a shuffled registry gives the same sorted order/schedule.
3. Client half (plan steps 7–8): move `game/scene/tug-events.ts`, `tug-line/*`, `tug-pickups/*` into
   `apps/client/app/features/tug/`; `tug.client.ts` with `sim`, `net` (pushTug + audio `playTugEvent` from
   `audio/bind-room-audio.ts:36,184`), `views.scene` (TugLine), new `views.pickups` slot (consumed in
   `pickup-field.tsx` + `seeker-pickups.utils.ts` layout by power kind), `hud.glyph` (`glyph-atlas.ts:103`).
   Remove hand mounts: `attach-room-to-world.ts:262` TUG_MESSAGE, `pickup-field.tsx:29`,
   `seeker-pickups.tsx:12` `tugs`, and (after re-claim) `net-canvas.tsx:39,85`. Update
   `active-features.test.ts` (expects `ACTIVE_FEATURES` empty).
4. `pnpm typecheck`, `pnpm test`, `pnpm lint` from the root.
5. D1 proof (2 SDK clients, zero decode errors, pull works). Fly /test-level headless and fire the tug.
6. Rerun `f2-perf.mjs` back to back. Report §3.8 (central count 7 not ≤ 2 — say it plainly; wire; step
   µs; frame ms; determinism; order test).
7. Docs: RFC §3.8 + §7 F2 row; `conventions/features.md` §3 slots (input, clear, bagWeight(cfg), use →
   boolean, RunContext.shieldAbsorbs, leaf-import rule) + §4 wire note.
8. Commit by pathspec; comment SHAs + numbers on #390; close only after the owner's push.

## Open questions

- none for the owner. Supervisor: re-grant `net-canvas.tsx` after workertwo commits.

## Lessons → memory

- `.claude/memory/feature-registry-import-cycle.md` (written this seam).
