Agent: workertwo · Lane: monolith gate + arch, finish reset (#220); #214 parked · Updated: 2026-09-23, ~19:50

## Goal

#220: build GATE and ARCH from `docs/art-direction/monoliths/monolith_archs.png` (read-only, untracked, never
`git add`). The gate is the finish line. Arches stand at 25/50/75%. `/test-level` resets the ship to the start
after the finish with a fade. The owner approved the plan through slur-supervisor. #214 stays parked on the
owner's eyes-on check.

## Done

- `f9248ef` — pillars (owner fix before #220). Every pillar is the same box, 12×12u, 50u tall. Pairs are
  mirrored, flush to the rail, and spaced by the 400→200u `intensityAt` lerp with no drops or jitter.
  `docs/ADD.md` §4 gained the pillar rule. ADR-018 (supervisor confirmed the number) reverses `568c523`.
  Removed: `placedShape`, `shapeAt`, the obelisk, `MonolithShapeName`, `MONOLITH_SHAPES`. Renamed
  `BOX_MONOLITH`→`PILLAR` and `MONOLITH_FIELD`→`PILLAR_FIELD`. `monolithField`→`pillarField`, plus a new
  `pillarRows(finishZ, config)` that returns the row z's.
- #220 filed: github.com/dineshsalunke/slur/issues/220. Plan approved.
- Earlier #214 SHAs: `523d63c`, `b6f1f45`, `8c9afaf`, `248096d`, `215159e` (see git log).

## State

- At `f9248ef`: client vitest 195/195 (28 files), tsc clean, biome clean.
- Headless /test-level still on scratch port 5186 at DPR 1: the first pillar pair stands mirrored and flush
  to both rails. Chrome and the scratch server were killed.
- #220: no file written yet.

## Uncommitted

None of mine. (`docs/art-direction/**` untracked files belong to ChatGPT. Never add them.)

## Held files

#220 claim, cleared by the supervisor:
- new: `game/scene/monolith-frame.ts` (+test), `game/scene/monolith-frames.tsx`, `game/scene/arch-field.ts`
  (+test), `routes/test-level/finish-reset.ts` (+test), `routes/test-level/finish-fade.tsx`
- edit: `game/scene/finish-gate.tsx`, `monolith-group.tsx`, `monolith-field.ts`(+test), `monoliths.tsx`,
  `routes/test-level/{local-loop,test-level-canvas,run-clock,local-combat}.tsx|ts`, `dev/tuning-schema.ts`
- `net-canvas.tsx` is free, but claim it with the supervisor first.
- **ON HOLD: `routes/test-level/local-combat.ts` and `test-level-canvas.tsx`.** workerthree holds them for
  the seeker bug fix. Don't edit either until the supervisor releases them. Then rebase the reset hook onto
  workerthree's commit. Steps 1–4 and the reset's pure step (`finish-reset.ts`) do not need them, so build
  those first.

#214 lane files are idle.

## Next

Owner decisions: **reset from a STANDSTILL**. **3 arches at 25/50/75% of finishZ.** An arch **snaps to the
nearest pillar row and replaces that pair**, so no other placement is dropped.

1. **Refactor `MonolithGroup`** to take `shape` + `bodies: MonolithTransform[]` + `seams: MonolithTransform[]`
   (skip the seam mesh when `seams` is empty). `monoliths.tsx` builds the transforms with
   `bodyTransform`/`seamTransform`.
2. **`monolith-frame.ts`**:
   - `FrameConfig { height, opening, legWidth, lintel, depth, below, overhang, chamfer }`.
   - `GATE_FRAME` = 200 tall, opening 112, legs 24, lintel 32, depth 24, overhang 6, below 60.
   - `ARCH_FRAME` = 150 tall, opening 112, legs 16, lintel 20, depth 16, overhang 0, below 60.
   - Trick: a leg is a pillar-style `MonolithShapeConfig` with `gap = opening/2 − (HALF_WIDTH + RAIL_W)` = 22
     and `height = frame height − lintel`. Then `bodyTransform`/`seamTransform` work unchanged at side ±1.
   - The lintel is a box at x 0, y = height − lintel/2, width opening + 2·legWidth + 2·overhang, below 0.
   - Arch height = 150 × (1 + 0.4 · intensityAt(segment)). All arches share one instanced mesh with nominal
     UV size.
3. **`arch-field.ts`**: `archRows(finishZ, rows)` = the nearest distinct row to each of 0.25/0.5/0.75 ×
   finishZ. `monoliths.tsx` removes those rows from the pillar pairs and renders arches there.
4. **`finish-gate.tsx`**: replace the green neon with the GATE frame at `track.finishZ`, plus a thin marigold
   floor strip across ±HALF_WIDTH at y ≈ 0.06. It is mounted in `WorldScene`, so hosted rooms get it too.
   There is no shared change: `step.ts:267` already sets `s.finished`.
5. **Reset**. `finish-reset.ts` is a module singleton `{ phase: idle|out|in, t, opacity, el }` with a pure
   `stepFinishReset(r, finished, dt)` that returns `'reset'` at full black. FADE_OUT is 0.35s, FADE_IN 0.45s.
   - `LocalLoop` steps it inside the `!simFreeze.on` branch.
   - On `'reset'`: `Sim ← spawnShip()` (standstill), `Prev ← Sim` position, `restartRunClock()` (make
     `run-clock.ts` restartable), and export `resetFor` from `local-combat.ts`, which already clears pickups,
     bolts and blocks.
   - The same useFrame writes `el.style.opacity`. `finish-fade.tsx` is a fixed `inset-0 bg-black
     pointer-events-none` div whose ref callback registers `el`. Mount it in `TestLevelCanvas` after the HUD.
6. Tests: the frame transforms clear the rails (inner leg face ≥ 56u), `archRows` picks the nearest row, and
   the reset step's phases and timing.
7. Verify: headless still of the gate (lower the finishZ or fly there) and a fade mid-frame. DPR 1, kill after.
8. Commit, report the SHA to the supervisor, then #214 step 5 whenever the owner plays it.

The NN-13 weighing for the PR body (DOM overlay won) is in the plan message to the supervisor. Record it in
the commit body.

## Open questions

1. #214: do sealed blocks stop a bolt (built as yes)? One `smashKeep` for every class? A marigold ember burst
   on a break?

## Lessons → memory

`.claude/memory/rear-view-panel-looks-like-geometry.md`
