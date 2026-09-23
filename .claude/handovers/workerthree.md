Agent: workerthree · Lane: homing seeker (#219) · Updated: 2026-09-23 (seam at ~155k)

## Goal

Build the homing seeker: the second held power. It is marigold, locks one visible racer ahead, is hard to
shake, and has two dodges (jump, or a late strafe). Rule: ADR-017 in `docs/DECISIONS.md`. The owner has
since changed three things (see Next): flight height, the art, and 3 power slots.

## Done

- `d0b2e61` ADR-017 draft + #219. `5771ee3` step 2 shared sim. `dfae252` step 3 server. `e656f18`
  `rooms/room-combat.ts` split. `8828f7a` `pickup-instances.tsx`. `cc3debe` step 4 pickup canister.
- `7fcabd4` — step 5: `attach-room-to-world.ts` mirrors `RunState.seekers` into ECS (`ProjInterp` +
  `NetSeeker{ownerId,targetId}` + `SeekerTrail`). `seeker-field.tsx` (`SeekerField`, mounted in
  `net-canvas.tsx`) → `seeker-bodies.tsx` (`SeekerBodies({collect})`, sink `(x,y,z,trail)`): 3 canister
  parts turned to the trail heading, a 12-point ring trail (`seeker-trail.ts`, spacing 2u), embers.
  5 draws, MAX 16. `sampleAt` is exported from `projectile-field.tsx`; `buildSeekerBody` from
  `seeker-pickups.tsx`.
- `2ca4bc8` — owner BUG fix: on `/test-level` a seeker pickup showed and fired as a bolt. Cause: the
  local ship kept a yes/no `Armed` tag. `Armed` is gone; `Held{power}` (traits.ts) replaces it.
  `local-combat.ts` fires by power, holds `localCombat.seekers`, runs `stepSeekers` (no ships yet → a
  wasted fire flies straight). `local-seeker-field.tsx` renders them (mounted in
  `test-level-canvas.tsx`). `LocalPowerSlot` shows Bolt/Seeker. The hosted `HeldPowerChip` gained
  `SEEKER`. Test: `routes/test-level/local-combat.test.ts` (2 cases, failed first, now pass).

## State

- Tests: client 197 pass (204 − 9 monolith tests cut in workertwo's `f9248ef` + my 2 — inferred from
  that diff). `pnpm typecheck` clean. `pnpm lint`: 7 old warnings, none mine.
- Hosted-room "bolt" report `[inferred, not reproduced]`: ADR-017 gate, scope `'room'` — *"When the limit
  is reached, a seeker pickup **grants a bolt**."* Solo: fire the z 790 seeker, grab the z 850 canister
  while it flies → bolt. Reported to the supervisor as an owner decision.
- Render check NOT done `[unmeasured]`. Scratch client on :5175 + headless Chrome on CDP :9334 loaded
  `/test-level` and the modules `/app/game/ecs/{traits,world}.ts` and
  `/app/routes/test-level/local-combat.ts`, but `world.queryFirst(LocalPlayer, Sim)` returned nothing
  (module-instance mismatch, or no ship before GO — not yet known). Both processes were killed. Driver:
  scratchpad `cdp.mjs` (eval/shot/key) — gone after this session; recreate it.
- Art read of `docs/art-direction/ingredients/ingredients.png` (the updated board), sent to the
  supervisor: a SQUARE-section missile (~2.2:1, chamfered corners, gunmetal panels, marigold seams,
  front collar), bright round core on the NOSE (my canister has it at the rear), dorsal fin + side
  fins, a short near-cube pickup of the same body, a THICK flame trail ("THICK. TRACKING. INTENSE.").
  Pickup, projectile and trail all change. Build nothing on the look until the supervisor says so.

## Uncommitted

None. `docs/art-direction/ingredients/ingredients.png` and `docs/art-direction/monoliths/` are untracked
and not mine. `.claude/phases/{INDEX,worklog}.md` are modified and not mine.

## Held files

- shared: `combat/{seeker,constants,pickups,combat-step}.ts` + tests, `schema.ts`, `sim-config.ts`,
  `ship-classes.ts`, `index.ts`
- server: `rooms/run-room.ts`, `rooms/run-room.test.ts`, `rooms/room-combat.ts`
- client: `game/scene/{pickup-field,projectile-field,bolt-pickups,pickup-instances}.tsx`,
  `game/scene/seeker-*`, `game/overlays/{threat-hud,held-power-chip}.tsx` + tests, `audio/sfx-map.ts`,
  `routes/test-level/{local-pickup-field,local-power-slot,local-seeker-field}.tsx`,
  `routes/test-level/local-combat.test.ts`, `dev/tuning-schema.ts`, `net/attach-room-to-world.ts`,
  `game/ecs/traits.ts`
- RELEASED to workertwo (#220): `game/net-canvas.tsx`, `routes/test-level/test-level-canvas.tsx`,
  `routes/test-level/local-combat.ts`. Ask the supervisor before touching them again.
- Not mine: `hit-spark.tsx`, `dev/*` except `tuning-schema.ts`, all of `docs/art-direction/`.

## Next

0. **2026-09-23: ship-height PLAN SENT to the supervisor. Waiting for approval.** Measured with a scratch
   script (30 seeds, heuristic target bot): a level seeker is blocked on 30–93% of shots, against 0–6.5%
   now. Proposal: breadcrumb homing. Leg 1 flies the LOS line. After that it follows the target's own
   (z,x) samples. The committed window homes direct at 40 u/s. Drop cruise/strike/climb/diveDz. Add
   `seekerFlyY` 0.5 + `seekerTrailLen`. Side finding: TTL 6s × 30 u/s closing ≈ 180u reach, far below
   lock range 600. Edit no shared sim until approved.
1. **OWNER CHANGE — seeker flies at SHIP height** (plan sent, see 0). Owner: *"the
   seeker has to travel at the same height as the other ships, which i think is around 1 - 2u."*
   Before changing any code, send the supervisor a short plan:
   - Read the real ride height from shared constants (`DEFAULT_TUNING` / `DEFAULT_JUMP` in
     `packages/shared/src/constants.ts`, or wherever the ship's resting y lives) and quote the line.
   - Say what happens to the cruise-high + dive phase (`seekerCruiseY`, `seekerStrikeY`, `seekerClimb`,
     `seekerDiveDz`, `cruiseHeight`, `diveBlock` only inside `seekerDiveDz`), and to the jump dodge.
   - Measure with a sim test how often a level seeker dies on a block before it reaches the target on
     procgen tracks. Decide whether it must steer around blocks. Otherwise mark it [inferred].
   - The wasted fire also flies level. Update ADR-017.
2. Render check on `/test-level` (supervisor requires the canister SEEN): fix the "no ship" query first.
3. 3-slot plan for the supervisor (build nothing): which slot E fires, what a full grab does,
   duplicates, HUD layout, files to claim, a new issue number. Hold step-6 HUD work that assumes one
   slot.
4. Step 6 audio + LOCKED HUD, step 7 target dummy + tunables, step 8 two-player room + doc rows.

## Open questions

- Owner: keep "seeker pickup grants a bolt when the gate is shut", switch to scope `'shooter'`, or dim
  the canister while the gate is shut? The slots design changes this.
- Supervisor: when to rebuild the look to the square board; is red-orange trail vs marigold resolved?
- A bigger impact burst needs `hit-spark.tsx` (ask first).

## Lessons → memory

None.

## Late update (after e9ef6c2) — supervisor order and owner art decision

- **Order:** (1) the ship-height plan to the supervisor, then (2) rebuild the look, (3) render check,
  (4) 3-slot plan.
- **Owner art decision:** the trail stays MARIGOLD, not the board's red-orange. Otherwise follow the
  board: square chamfered body, bright core on the NOSE, dorsal + side fins, a near-cube pickup, and a
  THICK trail (much wider than the bolt streak). Record the marigold departure in
  `docs/ART_MATERIALS.md` (Claude-owned, §7 decisions + departures shape, quote the board). Never
  in `docs/art-direction/`.
- workertwo has since edited `local-combat.ts` (added `restartLocalCombat`). It is theirs now.
