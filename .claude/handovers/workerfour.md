Agent: workerfour · Lane: #277 P2 cleanup sweep (review lane G) · Updated: 2026-09-26, night

## Goal

Work through the #277 P2 list (issue body + `.claude/phases/2026-09-26-review/*.md` P2 sections). Close #277
with the SHAs when done, or split the rest into smaller issues.

## Done

- b7df188 — `HIT_MESSAGE` + `HitMessage` in `combat/constants.ts`; server `'hit'` literals and the client handler
  use it. A dropped host hands START to a connected racer at once (`reassignHost` skips a disconnected host,
  runs from `onDrop` + `onReconnect`); test in `run-room.test.ts`.
- 62f663f — `START_STAGGER = CELL` → `START_STAGGER_U = 4` + `startGridX(seat)` (0, +1, −1, +2 … staggers,
  seat 0 is +0). Shared `typecheck` also runs `tsc -p tsconfig.test.json --noEmit`. Deleted dead
  `groupPockets`/`PocketGroup`/`overlaps`, `grooveLineX`, `type Phase`.
- Already gone before this lane: `ui/tag.tsx`, `net-debug-hud` (e40e89d), `ColorDot`.

## State

- Shared 406/406, server 53/53 on the tree at 62f663f (measured).

## Uncommitted

None.

## Held files

None held. Supervisor cleared, not yet started: batch B files (below) and the DEFAULT_TRACK_GEN list.

## Next

1. **Batch B, client dead code (CLEARED by supervisor):** delete `dev/from-user.ts`, `game/scene/environment.tsx`,
   `gradient-dome.tsx`, `env-config.ts` (they import only each other; verified by rg). Rewrite `accent.ts` to
   `ACCENT_ANCHOR = '#F59A24'`, `accent()`, `accentDerived()` (compute once; drop TRIALS, shift, setters,
   `accentHex`, `refresh`). `track-materials.ts:69-70` drop `ENVIRONMENTAL_MARIGOLD_*`.
   `sealed-block-variation.ts`: drop `SealedBlockWear.strength`; move `sealedBlockPerimeter` into its test.
   `monolith-field.ts` `pillarField` → test. `debris-physics.ts` `lowestHullY` → test.
   `track-blocks.tsx:181-182`: stop the per-frame `uSealedBevel`/`uSealedSeamWidth` writes (set once in
   `sealedBlockUniforms()`). Run client vitest + `pnpm lint`.
2. **DEFAULT_TRACK_GEN (claim CLEARED, except `routes/test-level/route.tsx` waits for workertwo #283 B1/B7):**
   `DEFAULT_TRACK_GEN = 'groove'` in `sim/space.ts`; `procgenDescriptor` default, `schema.ts:90,101,116`,
   `run-room.ts:94`, test-level `DEFAULT_GEN`. Tests calling `procgenDescriptor( seed )` get an explicit
   `'weave'` (ast-grep `procgenDescriptor( $S )` → `procgenDescriptor( $S, 'weave' )` in `*.test.ts` only).
   **Owner gate first:** the only non-test caller that omits the gen is `routes/pacing/analyze-worker.ts:18`
   (`/pacing`), so the flip changes /pacing from weave to groove. Supervisor wants this reported before commit.
3. Scene render P2s (wait for #283/#275 to settle, claim first): `isDead` dup (ship-model/ship-shadow),
   `Color.set(string)` caching (ship-model, ship-shadow, rail-glow), nebula-baker template keys, per-frame
   closures (projectile-field, seeker-field, block-debris, hit-spark, mine-shock, mine-shots, mine-bodies),
   idle VFX pools (bolt-embers, block-debris, explosions, hit-spark), explosions/hit-spark pool merge, pickup
   builder dup (bolt/mine-pickups), rail mask ×2, renames `explosions.tsx`→`explosion-field.tsx`,
   `ship.tsx`→`ships.tsx` (check #283 has not already moved them).
4. UI: truncated `useEffect` comments ×10 (workerfive report P2-2 list); player hex colours (check #284
   already fixed them).
5. Close #277 with all SHAs (`gh issue close 277 -c …`), or file the leftovers as a new issue.

## Open questions

- /pacing weave→groove flip under DEFAULT_TRACK_GEN: owner OK? (via supervisor)
- Earlier: should `PACING_HULL_L` move to `TRACK_CONTRACT.shipHalfL`?

## Lessons → memory

none (the claim slip — editing `combat/constants.ts` outside the claim — is already covered by
`claim-the-lane-before-the-first-write.md`).
