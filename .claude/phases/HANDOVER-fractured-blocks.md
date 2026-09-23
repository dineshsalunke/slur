# Handover — fractured blocks (issue #214)

Lane: **fractured-blocks**. Session of 2026-09-23. Stopped at the context watchdog (~235k).
Plan: `.claude/phases/2026-09-23-destructible-blocks-plan.md` (`2dafcdf`). Owner said go, via
slur-supervisor. Lane claimed at the top of issue #214.

## Update 2 (second session): step 2 DONE + /test-level combat (#217) — committed `b6f1f45`

Client prediction as planned (`game/block-state.ts`; `restoreConfirmed()` before replay). Owner
asked for the same on `/test-level`, with bolts and pickups: shared `combat/combat-step.ts`
(`canFire`, `aimBolt`, `stepBolts`, `stepPickups`) now drives both `RunRoom` and
`routes/test-level/local-combat.ts`. Verified in headless Chrome: pickup arms, E fires, a
placed ship smashed block 5504 and it stopped rendering.

**Owner direction, 2026-09-23:** a broken block must **shatter into pieces that fall off**, not just
vanish with a spark. So steps 3 and 4 merge: the chunk geometry from step 3 is also the debris. On a
break, launch the block's 2–3 chunks as pooled instances with velocity, spin and gravity
(client-only VFX). **Next: step 3 + debris.** Fractured blocks still render as sealed until then.

**File ownership (supervisor, 2026-09-23):** workerthree holds the bolt art. Their files:
`combat-look.ts`, `pickup-field.tsx`, `projectile-field.tsx`, `routes/test-level/local-pickup-field.tsx`,
`local-bolt-field.tsx`, and new `bolt-*` scene files. Keep the fractured art and debris in
`track-blocks.tsx` and new files of this lane (e.g. `fractured-block-*.ts`, `block-debris.tsx`). To
touch any workerthree file, even a colour constant, message workerthree first.

Stopped here at the context watchdog (~211k), at a seam: everything is committed.

## Update (second session): step 1 DONE — committed `523d63c`

Lint fixed. `resolveCollisions` no longer takes `cfg`. `simulate` keeps `_cfg` so its signature does
not change. Bolt resolution moved to shared: `hitShipsOf()` + `resolveBolt()` in
`combat/projectiles.ts`. `run-room.ts` is 295 non-blank lines (limit 300). Gate green: shared
155/155, server 7/7, client 182/182, typecheck + build clean. Lint has 0 errors. Its 7 warnings are
not from this lane. **Resume at step 2 (client prediction).** workerone holds the #213 leftovers
(`hit-events.ts`, `hit-spark.tsx`, `respawn.test.ts`). Copy the hit-spark pattern into a new file.
Do not edit theirs.

## State at the first stop: shared + server done, tested, NOT committed — lint fails

**Uncommitted, all mine** (nobody else was in these files; confirm with `git diff` before staging):

- `packages/shared/src/sim/space.ts` — `BlockBox`, `BlockKind`, `Block { id: number; kind }`,
  `BLOCK_ID_STRIDE = 64`, `blockId( seg, k )`.
- `packages/shared/src/sim/types.ts` — `SimWorld { broken: Set<number> }`, `createSimWorld()`.
- `packages/shared/src/sim/fracture.ts` (new) — `placeBlock()` rolls the kind per block id.
  `fractureRate` lerps 0.15 → 0.35 on intensity. Caps: width ≤ 12u, depth ≤ 12u. Pinched walls are
  never fractured (`breakable = false`).
- `packages/shared/src/sim/track.ts`, `gap-blocks.ts` — build blocks through `placeBlock`.
- `packages/shared/src/constants.ts` — `FlightTuning.smashKeep` (0.45 in `DEFAULT_TUNING`), `FRACTURE_*`.
- `packages/shared/src/sim/step.ts` — `simulate(…, cfg, world?)`. `smashThrough()` runs before
  `blockPush()`: an overlapped standing fractured block is added to `world.broken` and `vz *= smashKeep`.
  No stun. Invulnerable ships phase through without breaking. `blockPush` skips broken blocks, and
  skips fractured ones when a world is given. **No world → fractured behaves as sealed.**
- `packages/shared/src/combat/projectiles.ts` — `boltBlockHit( bolt, track, broken, sweep, cfg )`:
  swept z-range, nearest standing block.
- `packages/shared/src/schema.ts` — `RunState.blockBroken` `MapSchema<boolean>`, appended last.
- `packages/shared/src/index.ts` — exports `fracture.js`.
- `apps/server/src/rooms/run-room.ts` — room owns `blocks: SimWorld`, passes it to `simulate`. Bolt:
  a ship in front of the nearest block is hit as before. Otherwise the block eats the bolt, breaks if
  fractured, and broadcasts `hit` with `victimId: ''` (spark only; audio keys on `stunTimer`).
  `mirrorBreaks()` copies `blocks.broken` into `state.blockBroken`. `clearCombat()` clears both.
- Tests: `packages/shared/src/sim/fracture.test.ts` (new, 11 tests); `step.test.ts` and
  `clearance.test.ts` literals gained `id`/`kind` (`sealedBox()` helper); `run-room.test.ts` +3 tests.

**Measured this session:** `@slur/shared` test 155/155 pass; `@slur/server` test 7/7 pass;
shared, server and client `typecheck` all clean.

**Why smash has no throttle-suppression window** (a change from the plan): from `DEFAULT_TUNING`, a
bounce costs about 0.9s of travel and leaves you behind the block; keeping 45% of `vz` costs about 0.2s
and puts you through. So weave (free) < shoot (a bolt) < smash (0.2s) < bounce (0.9s + detour) already
holds. No new `SimShip` field, no schema change for it. [calculated, not play-tested]

## Blocking: `pnpm lint` fails on files I touched

From `biome check packages/shared/src apps/server/src`:

1. `combat/projectiles.ts` — import order (`--write` fixes it) and `boltBlockHit` cognitive complexity
   22 > 15. Fix: pull the three x/y/z overlap tests into `boltOverlaps( bolt, b, half, zLo, zHi )`.
2. `run-room.ts:200` — `stepWorld` complexity 19 > 15. Fix: extract the per-bolt body into
   `private resolveBolt( bolt, ships, sweep ): boolean` (returns spent).
3. `run-room.ts` — `noExcessiveLinesPerFile`. Check the limit in `biome.json`; the extraction above may
   not be enough. If not, move bolt resolution into a shared pure function in `combat/`.
4. `step.ts:244` — unused `cfg` parameter in `resolveCollisions`. **Check whether this pre-dates me**
   (`git show HEAD:packages/shared/src/sim/step.ts | pnpm exec biome check --stdin-file-path=step.ts`).
5. `step.test.ts` and `track.test.ts` length — `track.test.ts` is untouched by me. Check `step.test.ts`
   at HEAD the same way; I made it shorter, not longer.

Then run the full gate: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Next, in order

1. Fix lint (above), run the gate, **commit shared + server** by explicit pathspec, message referencing
   #214. The commit changes behaviour for hosted rooms: the server smashes, the client does not yet
   predict it (step 2), so a smash rubber-bands until step 2 lands. Land step 2 soon after.
2. **Client prediction.** New `apps/client/app/game/block-state.ts`: module singleton
   `blockWorld = createSimWorld()` and `confirmedBroken: Set<number>`.
   - `attach-room-to-world.ts`: `blockBroken.onAdd` → add `Number(key)` to both sets;
     `onRemove` → delete from both. Cleanup clears both.
   - `prediction.ts` `reconcile`: before replay, `blockWorld.broken.clear()` then refill from
     `confirmedBroken`; replay with `simulate( …, DEFAULT_SIM_CONFIG, blockWorld )`. This makes the
     replay pay the smash tax again instead of skipping a block the live sim already broke.
   - `net-systems.ts` `netFlightSystem` and `systems.ts` `localFlightSystem` (`/test-level`): pass
     `blockWorld`.
3. **Art.** In `track-blocks.tsx`, skip `kind === 'fractured'` blocks in the sealed mesh. Add a second
   instanced mesh in the same component (same segment loop — do not iterate segments twice), skipping
   `blockWorld.broken`. New `fractured-block-geometry.ts`: 2D polygons in XY extruded along z with
   `THREE.ExtrudeGeometry`, merged. Left and right chunks split by a jagged crack whose gap widens toward
   the top (a V notch that breaks the top contour — ADR-010 §3). Plus a recessed core: a thin polygon
   along the crack, extruded to depth 0.9, top at 0.4. Vertex attribute `aFracture` = 1 on crack walls
   and core. Vary per instance with a 0/π Y rotation (never a negative scale — it flips winding).
   New `fractured-block-shader.ts`: **do not reuse `patchSealedBlock`** — its vertex body snaps positions
   to a bevelled unit box and would erase the crack. Copy only the world-space UV projection, then
   `totalEmissiveRadiance += accent × intensity × vFracture`, roughness toward 0.75 and diffuse ×0.35
   inside the crack. Reuse `useSealedBlockMaps()`.
4. **Break burst.** `hit-spark.tsx` pattern (bounded pool, `park()`), marigold, fired when a fractured
   block id first appears in `blockWorld.broken` inside the visible window (keep a `seen` set; delete on
   removal so a mispredicted break can fire again).
5. **On screen.** `/test-level` at race speed on the chase camera: can sealed vs fractured be told
   apart in about half a second (ADR-009 gate)? Then a hosted room: smash one, shoot one.
6. **Docs.** ADR-015 in `docs/DECISIONS.md` accepting ADR-009 with two amendments (slow blocks are
   gone; ADR-014 made blocks bounce, so the tax must beat the bounce). Update GDD §5.7's destructible
   row. Add this handover and the plan to `.claude/phases/INDEX.md`.

## Still open with the owner

1. Do sealed blocks eat a bolt? **Built as yes** — one line in `run-room.ts` to change.
2. Freighter-smashes-cheap? **Built as one `smashKeep` for the whole roster** — a per-class data edit.
