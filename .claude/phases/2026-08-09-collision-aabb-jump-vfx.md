# 2026-08-09 — Collision hardening · jump tune · death VFX · boost removal · React refactor · AABB decision

A fix/polish pass on top of S3 (playtest-driven), plus two design decisions (boost→pickup, ship-size/AABB).
All shared/typecheck/build GREEN; **14 shared tests pass**. Human feel-gate still pending.

## What changed (as-built)

### 1. Jump feel tune — `packages/shared/src/constants.ts` `DEFAULT_JUMP`
- height 2.4→**3.2**, apexTime 0.34→**0.30**, descentTime 0.26→**0.24**, doubleHeight 3.0→**3.8**. Snappier + taller.
- Note: same-tick gravity in `simulate()` costs ~10%, so authored 3.2 peaks ~2.9u. `MAX_STEP`/`MAX_GAP` auto-retune (derived from jump).
- User also live-tuned `strafeAccel` to 150.

### 2. Collision hardening — `packages/shared/src/sim/step.ts` (three swept fixes, all one root class: point-sample → swept)
- **Floor tunnelling** — fast fall overshot the floor top by >`stepTol` in one tick and fell through. Fix: `landingFloor()` is a **swept** test keyed off `prevY` (captured pre-integrate in `simulate`), so any overshoot still lands.
- **Platform slip-under** — a platform has NO ground-level floor; a ship cruising in at y≈0 got nudged just under the body base (y0=0) and the point-sample `s.y >= b.y0` missed it → fell through the track. Fix: body kill is `s.x∈[x0,x1] && s.y < b.y1 && prevY + stepTol >= b.y0` (swept lower bound; strict upper bound so standing ON a platform top is safe).
- **Post-respawn invuln phase-through** — blind 1.5s invuln let a respawned ship fly THROUGH the next block/platform (and, on a platform, fall through the track). Fix: invuln is now **position-scoped** — it only spares the body you respawned into and `s.invulnTimer` is zeroed the first tick you're clear of every body, so the next hazard is lethal. (Falling still kills, invuln-independent.)
- Tests added: `fast fall does not tunnel through a floor`, `ground-level ship crashes into a platform face`, `post-respawn invuln does not let a ship phase through a LATER hazard`.
- **Method note:** every one of these was found by *reproducing headlessly against `packages/shared/dist`* (node one-liners driving `simulate()` and printing y/grnd/dead/kind), NOT by code-reading. Reinforced the "instrument, don't theorize" rule.

### 3. Z-fighting — `apps/client/app/game/scene/track-view.tsx`
Platform body top was coplanar with its blue floor slab. `emitBlocks()` now renders a platform body ending at `b.y1 - FLOOR_THICK` so the slab caps it cleanly. Collision untouched (reads real `b.y1`).

### 4. Death VFX — `apps/client/app/game/scene/explosions.tsx` (NEW)
`<ExplosionField>`: one additive InstancedMesh pool (240 shards), fully imperative single `useFrame`, no state/effect/subscription. Detects a ship's `dead` rising edge (local `Sim.dead` / remote last snapshot), spawns ~40 shards at the derezz spot tinted cyan/magenta, fades them. HDR × `toneMapped=false` + additive → existing global `<Bloom>` flares it. Wired into `net-canvas` after `NetLoop`. (`/solo` never dies → not wired there.)

### 5. Boost REMOVED → becomes an S5 pickup; energy system cut
Removed `boost` input + the boost/energy branch in `applyLongitudinal`, `energy` from `SimShip`/`spawnShip`/`copyShip`, the `energy` schema field (safe mid-schema removal: LAN dev, atomic client+server rebuild — noted in `schema.ts`), the 5 boost/energy `FlightTuning` fields, and Shift binding in `keyboard.ts` (Shift now free). `DEFAULT_TUNING` is documented as the Fighter/baseline preset.

### 6. React house style (new user directive → CLAUDE.md non-negotiable #9 + `conventions/r3f.md`)
- No `<>` shorthand → `<Fragment>`. One component per file. RR route modules exempt.
- Split: `net-canvas.tsx` → `net-loop.tsx` + `net-debug-hud.tsx`; `game-canvas.tsx` → `game-loop.tsx` (`GameLoop`); `ship.tsx` → `ship-model.tsx`. All Fragment conversions done.
- Pre-existing lint debt untouched: `net-canvas.tsx` `onChange` cognitive-complexity 24 (red at HEAD before this session).

### 7. GDD reconciled — `docs/GDD.md`
§5.1 (boost→pickup, energy cut), §5.5 (per-ship `FlightTuning` note + **locked ship footprint table** + AABB note; boost dropped from class stats), §8 (Shift unbound), §10 Q2 resolved (fuel/energy cut), new §5.6 as-built ingredient snapshot.

## Decisions locked
- **Boost is a pickup, not a base stat** (S5). No fuel/energy meter.
- **Ship footprint LOCKED:** Fighter **2.6 × 3.8 × 0.9**; per-class width Interceptor ×0.8, Freighter ×1.5; height cosmetic. This is the AABB hitbox AND the 3D-model target box. Corridors stay 6u.
- **Collision → AABB, width+length** (height cosmetic). Gap-support rule still open (recommend "held while any part on floor").

## PENDING (next code slice) — implement AABB collision
1. Add `halfW`/`halfL` to `FlightTuning` (baseline 1.3 / 1.9); per-class = width scale.
2. `step.ts`: floor-support + body-crash test the `[x±halfW]` (and `[z±halfL]`) span vs spans/bodies, not a point; `clampToEdges` clamps the wing (`±(halfWidth−halfW)`).
3. Re-derive `MAX_STEP`/`MAX_GAP`/`MIN_CORRIDOR` for the footprint; assert widest class (Freighter halfW≈1.95) still clears `MIN_CORRIDOR`.
4. Tests: wing-clips-block-now-dies; land-with-half-off-a-ledge still supported. Resolve the gap-support rule with the user.

Then: S3 human feel-gate → S4.

---

## 2026-08-09 (pt.2) — Obstacle redesign: strafe-weave core + AABB (Prep)

**Trigger (user):** blocks are track-wide walls, brutal at speed. Goal = *fast* game where **strafing
around blocks is the core loop** (cuberun), **jump is only for gaps**, and blocks are avoided-or-destroyed
(destroy = later pickup). Root cause: a "block" is a full-20u-deep wall leaving one lane → a binary
lane-select, not a weave. Fix is obstacle *geometry/archetype*, not a global unit rescale (units are fine:
32u track ≈ 12 ship-widths, a dodge is ~0.3–0.4s).

### Decisions (this pass)
- **Cut `platform`** — clean taxonomy: **gap→jump, block→strafe/destroy**. `MAX_STEP` (only used by platform gen) is retired.
- **Blocks → discrete, tall, UN-jumpable cubes in an open-scatter field** (user picked open-scatter over shifting-lane slalom). `Block` gains `z0/z1` (= the AABB z-extent we needed anyway → this pass IS the pending AABB slice).
- **Un-jumpable is the point:** `BLOCK_HEIGHT` → ~8u (well above double-jump reach) so strafe is the *only* answer. (Was 2.5u = deliberately jumpable; that muddied the two mechanics.)
- **Speed stays `maxCruise` 55** — tuned live at the feel-gate.
- **Gap-support rule = generous** ("grounded while ANY part of footprint on floor") — see AABB×MAX_GAP finding above; keeps gaps forgiving once the ship is a box.

### Open-scatter field algorithm (deterministic — integer/PRNG/`+-*/`/compare only)
Partition the segment's 20u z-range into **2–3 rows**; each row *may* hold **one** cube (rows can be empty →
breathing space). Cube: width **2.5–4.5u** (≈1–1.7 ship-widths), depth **5–6u**, height `BLOCK_HEIGHT`,
`x0` anywhere across the width, z-jittered within its row.
- **Fairness (provable, no pigeonhole needed):** one cube per z-row → cubes are **z-disjoint** → every
  z-slice has **≥ 32 − 4.5 = 27.5u** open. Trivially ≥ ship 2.6u + margin.
- **Reachability assert (test):** consecutive non-empty rows — lateral dodge needed ≤ strafe reach over the
  row's z-time (`strafeClamp·(rowDepth/maxCruise)·0.8` ≈ 7.7u ≥ max cube 4.5u+ship). Mirrors how `MAX_GAP`
  is derived from jump feel → difficulty is a config edit.
- New archetype mix (tunable): **plain 0.35 · block 0.45 · gap 0.20** (block is now the *star*, not a rare gate).

### AABB collision (Minkowski) — folds in the pending slice
- `FlightTuning += halfW 1.3 / halfL 1.9` (per-class = width scale; `halfH 0.45`).
- Collision point→AABB: test `s.x`/`s.z` vs each cube inflated by `[±halfW, ±halfL]`; floor/top by `halfH`.
- `clampToEdges` clamps the **wing** to `±(halfWidth − halfW)`.
- Re-derive `MAX_GAP` for the footprint; **assert** effective gap (`SEG_LEN − 2·halfL` under generous rule) ≤ `MAX_GAP`, and widest class still clears `MIN_CORRIDOR`.

### Files
- `packages/shared/src/sim/track.ts` — `Block +z0/z1`; drop `platform`; open-scatter `block` field; new probs; `passableCorridorWidth` reused as fairness assert.
- `packages/shared/src/constants.ts` — `halfW/halfL/halfH`; retire `MAX_STEP`; re-derive `MAX_GAP`; `BLOCK_HEIGHT`↑.
- `packages/shared/src/sim/step.ts` — AABB body-crash + floor-support + wing-clamp; generous gap-support.
- `packages/shared/src/sim/step.test.ts` — new tests (below).
- `apps/client/app/game/scene/track-view.tsx` — instanced cubes sized from `z0/z1`; delete platform render path.

### Tests
wing-clips-a-cube-now-dies (center was safe) · passable lane ≥ ship-width across N seeds · no `platform` ever emitted · same-seed determinism byte-identical · effective-gap ≤ MAX_GAP assert · land-half-off-a-ledge still supported (generous rule).

**STATUS: Prep done, awaiting greenlight → Implement.**

---

## 2026-08-09 (pt.3) — 4u cell grid + LOCKED 5-class ship matrix + model assignment

### Base unit LOCKED: `CELL = 4u`
Track **16 lanes** = 64u (`HALF_WIDTH 16→32`, `DEFAULT_TUNING.halfWidth 16→32`); segment **5 z-cells**
(`SEG_LEN 20`); cube **1×1 cell** footprint (4u), **2 cells / 8u tall** (un-jumpable). Movement stays
**continuous** (author on grid, fly free). Fairness invariant `MIN_CORRIDOR 6` → **≥2 contiguous open lanes (8u)**.

### Ship = ~1-cell craft; **model = hitbox** (WYSIWYG, uniform scale — user-picked)
Footprints **derived from measured model bboxes** (no distortion). Old single-model lock (Fighter 2.6×3.8)
**superseded** — Fighter re-locked to challenger-derived 2.6×2.52.

**Measured native model bboxes (jq on glTF POSITION accessors):**
| Model | W(x) | H(y) | L(z) | W/L | minY |
|---|--|--|--|--|--|
| executioner | 10.02 | 1.85 | 9.20 | 1.09 | −0.77 |
| challenger | 10.50 | 3.02 | 10.18 | 1.03 | −0.82 |
| bob | 10.50 | 2.04 | 5.61 | 1.87 | −0.87 |
| dispatcher | 4.90 | 3.09 | 10.26 | 0.48 | −1.42 |
| imperial | 7.73 | 3.30 | 18.55 | 0.42 | −1.31 |

**LOCKED assignment + per-model scale (`scale = widthCells·4 / nativeX`; lift = −minY·scale so hull sits at y=0):**
| Class | Model | width (cell/u) | halfW | halfL | scale | lift | modelH (u) |
|---|---|--|--|--|--|--|--|
| Interceptor | executioner | 0.50 / 2.0 | 1.00 | 0.92 | 0.1996 | 0.154 | 0.37 |
| Fighter | challenger | 0.65 / 2.6 | 1.30 | 1.26 | 0.2476 | 0.203 | 0.75 |
| Comet | bob | 0.55 / 2.2 | 1.10 | 0.59 | 0.2095 | 0.182 | 0.43 |
| Phantom | dispatcher | 0.60 / 2.4 | 1.20 | 2.51 | 0.4898 | 0.696 | 1.51 |
| Freighter | imperial | 0.90 / 3.6 | 1.80 | 4.32 | 0.4657 | 0.610 | 1.54 |

(`ship-model.tsx` currently loads `imperial` with **bob's** hardcoded numbers — a placeholder bug; per-class
scale/lift above replaces it. `SHIP_FACING` still to verify per model at implement.)

### Full stat matrix + governing constraints → **GDD §5.5 (rewritten, locked)**.
Weave = f(width), Gap = f(length) — emergent, models chosen to match. Track floored to least-capable class per
hazard (shared server track); jump variance capped (no sub-3.0) so no class is dead on a bad seed.

**Scope note:** this pass wires the **grid + AABB + Fighter baseline + the 5 models (correct scale/lift)**.
Full per-class FLIGHT stats (speed/strafe/jump/armour) are **S6** — GDD documents them as the locked spec.

**STATUS (pt.3): matrix LOCKED, GDD updated. Still awaiting greenlight on the pt.1/pt.2 Implement slice.**

---

## 2026-08-09 (pt.4) — Class↔Ship taxonomy + server-authoritative registry (scope grew to full S6)

**User directives:** (a) implement **full per-class flight stats** now; (b) classes must live in the **backend,
available to everyone, easy to add many**; (c) a **class is a GROUP** — one ship/class today, several later.

**Architecture (= the netcode "identical sim both ends" rule, not just good practice):**
- **`@slur/shared/ship-classes.ts`** (framework-free source of truth):
  - `ShipClass` = balance unit → owns full `FlightTuning` (incl. `halfW/halfL` footprint). 5 classes.
  - `Ship` = cosmetic variant `{ id, name, classId }` → inherits class mechanics. 5 ships (1/class today).
  - `SHIP_CLASSES`, `SHIPS`, `tuningForShip(id)`, `ALL_CLASS_TUNINGS` (fairness floors to this set).
- **`schema.ts`**: append `@type('string') shipId` (APPEND-ONLY; string ⇒ no reorder footgun, adding classes
  never remaps). Set once at join / on hot-swap. Sim resolves `shipId → class → tuning` on BOTH ends.
- **Visuals** stay client-side (`apps/client .../ship-visuals.ts`), keyed by the same `shipId`.
- **Selection this pass:** dev **hot-swap keys 1–5** → `room.send('setClass', shipId)` → server sets
  `p.shipId` (authoritative). Real pick-screen = S4/S6.
- Ships in a class are **mechanically identical** (cosmetic-only) — keeps the class the honest balance unit.

**`simulate()` signature UNCHANGED** — it already takes `t: FlightTuning`; per-class = pick the right `t`.
6 call sites swap `DEFAULT_TUNING` → `tuningForShip(...)`: server room, client prediction, net-systems,
systems (solo), chase-camera, banking.

**Implement in 3 review batches, 1 atomic commit:**
1. **Data model** — `constants.ts` (`CELL`, `FlightTuning +halfW/halfL`, DEFAULT_TUNING halfWidth 16→32) +
   `ship-classes.ts` (new) + `schema.ts` (+shipId).
2. **Geometry/collision** — `track.ts` (cell grid, `Block +z0/z1`, drop platform, worst-class fairness) +
   `step.ts` (AABB Minkowski + generous grounded) + `step.test.ts`.
3. **Wiring** — `run-room.ts` (per-ship tuning + `setClass` handler + default `shipId`) + client tuning
   resolution (4 sites) + `ship-visuals.ts` (new) + `ship-model.tsx` (per-ship model) + hot-swap keys +
   64u camera.

---

## 2026-08-09 (pt.5) — RECONCILE (arc close: planned vs done)

**Implemented + committed `12049bd`** (one atomic commit; typecheck + 18 shared tests + lint[only pre-existing
net-canvas debt] GREEN):
- **Batch 1 (data model):** `ship-classes.ts` registry (Class/Ship two-level), `CELL` grid + `halfW/halfL`
  on `FlightTuning`, `schema.ts +shipId` (append-only string). ✓ as planned.
- **Batch 2 (geometry/collision):** `track.ts` cell grid + `Block +z0/z1` + open-scatter cube fields +
  platform cut + worst-class gap-fairness; `step.ts` AABB (Minkowski) + generous grounded; retired
  `MAX_STEP`, added `jumpReach`/`jumpAirtime`; tests rewritten (wing-clip + wing-clear + generous-support +
  per-class gap). ✓ as planned.
- **Batch 3 (wiring):** per-ship tuning at all 6 sim/camera/bank sites; `run-room.ts` `setClass` handler;
  `ship-visuals.ts` + live per-ship model swap (`ShipView`/`useTrait`); hot-swap keys 1–5; discrete-cube
  render (fixed the full-segment-depth render bug). ✓ as planned. **+ lint-complexity cleanup** (extracted
  `hitsLethalBody`/`bestFloorInSeg`/`assertSegmentFair`/`mirrorShipId`/`playerLines`+`localShipLines`).

**Deviations from plan:** (a) `shipId` chosen over `classId` on the wire (a ship resolves to its class);
(b) **Freighter capped at feel-gate** (imperial 2.16c→1.5c long, 0.9c→0.62c wide) — model was too big; weave
penalty moved from hitbox-width to sluggish strafe; (c) full per-class flight + all 5 models pulled forward
from S6 (user directive). Fighter footprint re-locked from the challenger model (2.6×3.8 → 2.6×2.52).

**Design work this session (paper, now durable in docs — not code):**
- **Balance principle** — playstyle-level, not geometry-equal; weave self-balances via speed; only FIT +
  GAP-REACH are hard floors. → memory `balance-at-playstyle-not-geometry` + GDD §5.2/§5.5.
- **Level system** — hand-authored levels via `Track.segmentAt()` abstraction; sparse-feature format; a
  two-floor validator (flood-fill FIT + per-gap GAP-REACH); procedural `D(z)` = trend + deterministic
  triangle-wave. → GDD §5.2 + backlog "Level authoring" (post-S4).
- **Mechanic master-menu** — ~55 kept mechanics tagged [R/M/B] + base-capabilities BC1–BC8; straight-ribbon
  + no-moving-geometry locked; Tractor redefined (momentum leech); parked/dropped recorded. → GDD §5.7.
- **Ship-content pipeline** (code→JSON→DB) → backlog milestone.

**S3 CLOSED. Next: S4 (session flow → complete Race).**
