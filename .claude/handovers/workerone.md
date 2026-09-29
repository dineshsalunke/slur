Agent: workerone · Lane: #354 fake deck reflections (owner-approved A+B+C) · Updated: 2026-09-29 (part 2a taps)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#354: warm additive streaks on the deck under rails, block seams, pickups and exhausts, like
`docs/art-direction/golden-reference/cruise-lighting.png` (LOOK only). Every tier, near-zero cost.
Then, as a SEPARATE commit with its own measurement: stronger deck Wear maps + deck anisotropy.

Owner answers (2026-09-29): fix pickup spots over holes (DONE); accept the left-rim sheen under
the white sky light (no change); adopt workerthree's albedo defaults in part 2
(Environment.rotation 180 + Metal.baseColor #595c62).

## Done

- `3c576aa` `668df76` `f0562e7` part 1; `a249221` ADR-031 + ART_MATERIALS item 23.
- `59aa760` pickup spots clipped to a per-pickup clear deck box (x0,x1,z0,z1 in instance matrix
  column 1). A z-only run missed lengthwise cracks (seed 1, x −4…4).
- `6cb1f36` + `7cb7e05` block seam streaks (owner feedback via supervisor): Gaussian cross-profile
  from half the seam width, blur grows with distance (`uReflBlur` 0.01 × (0.5 + Deck.roughness)),
  peak × sqrt(σ0/σ); per-seam free deck distance along the face normal (0 in a butt joint), written
  per frame in `emitWindow` from neighbour segments (`windowSegs`). Emitters fill a `ReflEmitter`
  struct. `7cb7e05` adds the new utils file that `6cb1f36` missed (untracked).
- `bb86b64` ADR-031 + ART_MATERIALS item 23 updated for the three commits above; left rim marked
  accepted.

## State

- Gap-lip [measured, 8 seeds 20260921,1–7, 180,480 frames]: pickup >¼ over a hole 7.06% → 0.00%;
  on-deck spot light kept 99.44%. Block streaks >¼ over a hole 0.35% (unchanged; not in scope).
- Butt joints [measured, seed 20260921]: 314 of 429 sealed blocks meet end to end. Mirrored-camera
  cull = camera cull for vertical faces [inferred, maths]; the joint was the cause.
- Taps [measured, scratchpad `153f7ede…/shots`]: `before-*` / `after2-*` at ship (−2, 596) and
  (0, 1020): stray streaks gone, streaks now seam-width and soften with distance. `gap-before` /
  `gap-on`: pickup tick over the gap gone. The owner's exact screenshot view was not reproduced.
- Clearance CPU [measured, node]: 0.011 ms/frame mean, 0.17 ms worst. GPU perf not re-run.
- Client vitest 656/656, typecheck + `pnpm lint` clean.
- Part 2a Wear sweep [measured, taps at (−2,596) and (0,1020), albedo defaults on]: scratchpad
  `dce8336e…/scratchpad/shots/{base,w1,w2,w3}-*.png`; `wear.mjs` (SETS, VIEWS), `regstat.mjs`.
  base = 0.3/0.25/0.7/1; w1 = valueSpan 0.2, roughSpan 0.4, metalMin 0.5; w2 = 0.15/0.5/0.35;
  w3 = 0.1/0.6/0.2. Left-deck patch at (−2,596): mean luma 35.9→37.8→40.1→42.8, sd 9.2→9.7→10.0→10.3.
  Block patch mean 27→32→37→41. The dials also drive blocks; w3 is heavy on near block faces.
- Scripts in scratchpad `153f7ede…/scratchpad`: `gaplip.mjs` (SEEDS, NOCAP), `jshot.mjs` (VIEWS,
  NAME, TUNING), `joints.mjs`, `cleartime.mjs`, `perf.mjs`, `gapshot.mjs`.

## Uncommitted

- none.

## Held files

- `deck-reflection/*`, `block-reflections/*`, `pickup-reflections/*`, `exhaust-reflections/*`,
  `track-floor/track-floor.tsx`, `track-blocks/*`, `pickup-field.tsx`, `exhaust-field/*`,
  `deck-breakup.ts`, `docs/DECISIONS.md`, `docs/ART_MATERIALS.md`.
- `track-texture.ts` + `track-materials.ts`: cleared for part 2, not edited yet.
- `dev/tuning-schema.ts` + `dev/tuning-panel/tuning-panel.tsx`: ON LOAN to workerthree (#356).

## Next

1. Wait for owner verdict on the block-streak taps. Possible dials: `uReflBlur` (no schema dial yet
   — add `Reflect.blur` when tuning-schema.ts is back), streak length via `Reflect.falloff`.
2. Part 2a: owner picks a Wear set (w2 suggested); commit the defaults when tuning-schema.ts is back; part 2b: deck anisotropy (MeshPhysicalMaterial,
   extras at 0). Adopt Environment.rotation 180 + Metal.baseColor #595c62 when the schema is back.
3. Close #354 with SHAs after part 2.

## Open questions

- Owner: are the new block streaks right (length, blur rate)?

## Lessons → memory

- `.claude/memory/commit-pathspec-skips-untracked.md`.
