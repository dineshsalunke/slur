Agent: workerfour · Lane: #277 P2 cleanup sweep, scene-render P2s · Updated: 2026-09-26, evening (seam at ~210k)

## Goal

Land the #277 scene-render P2s in small slices (S1–S7 + P2-8), look-check them headless, then close #277 (tell the
supervisor first — whoever lands the last #277 item closes it; UI P2s belong to workertwo).

## Done

- b7df188, 62f663f — earlier #277 items (hit message constant, host handoff, start grid, dead shared code).
- 1b111b6 — track-blocks: no per-frame uSealedBevel/uSealedSeamWidth writes.
- d342d6d — batch B dead code (env/dome/env-config/from-user, accent trials, ENVIRONMENTAL_MARIGOLD_*, wear.strength;
  sealedBlockPerimeter/pillarField/lowestHullY moved into tests).
- 8ad39b0 — S1: `ship-dead.ts` (one isDead); `hull-look.ts` (applyHullLook, keeps ShipModel useFrame under biome
  complexity 15); hull/shadow/rail colour `set` only when the string changes (rail-glow via WeakMap per uniforms).
- e7ce4e7 — S2a: nebula-baker precomputed `Sky.*` paths; projectile-field/seeker-field/mine-shock sinks built once.
- b706baa — S2b (own commit for workerthree's bisect): mine-shots hoisted readEach callbacks; mine-bodies uses new
  `instanced-commit.ts` commitInstances. No look/behaviour change.
- bb433b0 — S3: `vfx-shard-pool.ts` (+ test) shared by explosion-field and hit-spark; high-water `mesh.count`, idle
  skips upload; init guard dropped (initShardMesh idempotent). `explosions.tsx` → `explosion-field.tsx`.
- 47cce3e — S4: bolt-embers per-slot `parked` + count 0 when idle; block-debris slot `parked` + `dirty`, glow uploads
  only while active; debris drain sinks built once (`debris.now` scratch).
- 5505ed8 — S5: `pickup-body.ts` pickupBody(shell, glyph, core) for bolt/mine/boost/shield/seeker pickups.
  workerthree told the SHA.

## State

- At 5505ed8: client tsc 0 errors; vitest app/game + routes/test-level 371/371; biome shows only pre-existing
  component-module-scope plugin warnings; comment ratchet clean (measured, shared tree).
- Look of S3/S4/S5 [unmeasured] — no live frame check yet.

## Uncommitted

None.

## Held files (claim CLEARED by supervisor)

- S6: track-floor.tsx, monoliths.tsx, use-rail-mask.ts, track-rail.tsx (rail mask built once).
- S7: ship.tsx → ships.tsx + world-scene.tsx import line only. **Tell the supervisor when S7 lands** (workertwo's
  #283 B4/B5 scene moves wait on it).
- P2-8: debris-ground.ts (one trackGround per track, WeakMap, evict oldest not whole map), block-debris.tsx,
  meteor-chunks.tsx, meteor-strikes.tsx.
- Do NOT touch: track-blocks.tsx (workerone), chase camera + exhaust-* (workerfive), UI files (workertwo).

## Next

1. S6 rail mask: read `.claude/phases/2026-09-26-review/workerfour.md` P2-4. Build runs + mask once per track
   (module cache keyed by track or one owner passing down); share the texture; track-rail reuses the runs.
2. S7 rename ship.tsx → ships.tsx (`git mv`; ast-grep drops the `;` — fix with Edit). Message supervisor.
3. P2-8 debris-ground WeakMap.
4. **Supervisor condition before closing #277:** headless tap per pickup kind (bolt, mine, boost, shield, seeker)
   plus an explosion, compared against each change's parent commit (for S3/S5: bb433b0^ / 5505ed8^). DPR 1,
   `--mute-audio`, a CDP port free on IPv4+IPv6, kill by PID. Scratch server/short course memories:
   `seed-a-finished-room-with-a-scratch-server.md`, `place-the-ship-over-cdp.md`, `step-the-r3f-clock-for-timed-taps.md`,
   `fake-performance-now-for-timed-taps.md`. Report pass/fail to supervisor.
5. Tell the supervisor, then `gh issue close 277 -c "<SHAs>"` if it is the last item.
6. DEFAULT_TRACK_GEN remains HELD for the owner's /pacing weave→groove decision (plan in git history of this file).

## Open questions

- /pacing weave→groove flip under DEFAULT_TRACK_GEN: owner OK? (via supervisor)
- Should `PACING_HULL_L` move to `TRACK_CONTRACT.shipHalfL`?

## Lessons → memory

- `.claude/memory/koota-readeach-tuple-is-exact.md` (new this seam).
