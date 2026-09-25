Agent: workerone · Lane: #258 follow-up — arch defects + pit redesign + #4a4d52 · Updated: 2026-09-25

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Fix the owner's monolith-arch defects and the "raindrops on a windshield" pits (arch face and the deck
behind the ship). Set Metal.baseColor to #4a4d52. Send before/after captures to the supervisor BEFORE the
push.

## Done

- The build is complete in the working tree. It is NOT committed. Before/after captures went to the
  supervisor. Waiting for its OK.

## State (measured unless marked)

- Gates pass: `pnpm typecheck` · `pnpm lint` (5 old warnings; track-texture.ts line count is old) ·
  client vitest 49 files / 353 tests.
- Draws are 92 at the approach/up/deck/ship/block poses, before and after. The face/lintel pose gives 85
  after. It was not measured before. No mesh was added.
- Shots: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/394284f6-85cc-45b9-90bf-94433610f378/scratchpad/shots/{before,after}-{approach,face,lintel,up,deck,ship,block}.png`.
  Script: `.../scratchpad/arch-shoot.mjs <url> 9341 shots <label> '{}' [pose]`. It kills its own Chrome.
- Pit field is Worley (6 cells/u, per-point radius 0.15–0.4 cells, jitter 0.8) + a 0.5 cells/u value-noise
  cluster (weight 0.15). The threshold comes from a quantile. It replaced the brief's thresholded value
  noise, which made worm/amoeba blotches (seen in the intermediate after2 shots).
- On the ship and block the pits read dense and "pocked" [my judgement]. Pit.density or Pit.cavity tunes it.
- The groove cavity in the packed R channel is still dead. Pit darkening is now in the albedo map.

## Uncommitted

apps/client/app/dev/tuning-schema.ts · game/scene/{metal.ts, monolith-geometry.ts, monolith-geometry.test.ts,
monolith-group.tsx, track-rail.tsx, track-texture.ts, track-texture.test.ts, world-scene.tsx, pit-field.ts,
pit-field.test.ts} (all under apps/client/app/) · docs/ART_MATERIALS.md.

## Held files

The uncommitted list above. monolith-frames.tsx and track-materials.ts are claimed but untouched.

## Next

1. HOLD (supervisor, 2026-09-25): no commit or push until the owner answers. The supervisor's read is
   that the ship and the lit deck patch show large round craters ("Swiss cheese"), not fine pitting.
   Expect a lower `Pit.density` default (tuning-schema.ts) and a smaller radius: `PIT_SIZE` and/or a
   higher `PIT_CELLS_U` in pit-field.ts. Tune, re-shoot deck/ship/block with the script, and resend.
2. On OK: `git commit -- <the uncommitted paths>` with message `fix(scene): pit field, graphite grain,
   arch leg v, #4a4d52 (#258)`, then `git push origin dev`. Put the ≥5-option weighing for the leg fix in the
   commit body (shader v-rescale vs per-height geometry vs a per-instance attribute vs extra groups vs
   box-projection).
3. Commit this handover by path and report the SHA.

## Open questions

- Owner: are the pits on the ship and block too dense?

## Lessons → memory

`.claude/memory/threshold-noise-makes-worm-pits.md`
