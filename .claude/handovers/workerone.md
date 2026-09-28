Agent: workerone · Lane: #354 fake deck reflections (owner-approved A+B+C) · Updated: 2026-09-29 00:40

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#354: warm additive streaks on the deck under rails, block seams, pickups and exhausts, like
`docs/art-direction/golden-reference/cruise-lighting.png` (LOOK only). Every tier, near-zero cost.
Then, as a SEPARATE commit with its own measurement: stronger deck Wear maps + deck anisotropy.

Owner decisions (via supervisor): approach A+B+C approved. v1 has NO stencil: measure and report
how often a streak floats over a gap lip. Exhausts are IN v1. Do not touch canvas-gl.ts or
scene-effects.

## Done

- `3c576aa` part 1: rail sheen (deck patch) + block-seam streaks.
- `668df76` FIX: NaN from `pow` of a negative base blacked the main view.
- `f0562e7` pickups + exhausts + tuned defaults.
- `a249221` ADR-031 in `docs/DECISIONS.md` + `ART_MATERIALS.md` §2 row and §7 item 23. Pushed.

## State

- High-tier perf rerun [measured 2026-09-29, 3 reps, no other headless Chrome]: best on 8.5 /
  off 9.7 / no rail 9.7 ms; runs bimodal 8–10 or 14–16 ms. The old +1.7 ms was noise. Draws 129 vs 123.
- Gap-lip count [measured, CPU copy of the streak vertex maths vs `segmentAtZ` floors, 8 test-level
  seeds, camera every 2u on 3 lanes, 181,140 frames]: block streaks 0.12% touch a hole, 0.05% >¼ of
  light over a hole (generator puts no block in the segment after a hole). Pickup spots 5.9% >¼ over
  a hole; 7.8% of frames show one. Cause: the spot sits at the mirror point, far toward the camera,
  so a hole between camera and pickup catches it.
- On screen [measured, seed 20260921, ship x 0 z 1346, pickup (-7.7, 1450), hole z 1380–1400]: a
  short marigold line crosses the gap band below the pickup; gone with `Reflect.pickup` 0.
- Scripts in scratchpad `eb2b4de9…/scratchpad`: `perf.mjs` (Q, REPS env), `gaplip.mjs` (SEEDS env),
  `gapshot.mjs`, `diff.mjs`. First /test-level load after a peer commit can take > 60 s (Vite
  re-optimise); the waitForFunction timed out once, rerun passed.

## Uncommitted

- none.

## Held files

- `deck-reflection/*`, `block-reflections/*`, `pickup-reflections/*`, `exhaust-reflections/*`,
  `track-floor/track-floor.tsx`, `track-blocks/track-blocks.tsx`, `pickup-field.tsx`,
  `exhaust-field/*`, `deck-breakup.ts`, `docs/DECISIONS.md`, `docs/ART_MATERIALS.md`.
- `dev/tuning-schema.ts` + `dev/tuning-panel/tuning-panel.tsx`: ON LOAN to workerthree (#356). Do not
  edit until the supervisor says workerthree committed.
- `track-texture.ts` (Wear) and `track-materials.ts` (anisotropy): CLEARED by the supervisor for part 2
  (2026-09-29). Nothing edited yet.
- Both owner questions below are with the owner (supervisor confirmed).

## Next

1. Part 2a: explore wider Wear ranges (`Wear.valueSpan` 0.3, `Wear.roughSpan` 0.25, `Wear.metalMin`
   0.7) through `slur.tuning.v1` in headless taps — no file edits. Pick values, before/after taps.
2. When tuning-schema.ts is back: commit new Wear defaults (separate commit, with the taps).
3. Part 2b: deck anisotropy via MeshPhysicalMaterial with extras at 0 (three 0.185.1: Standard and
   Physical share the 'physical' program; anisotropy compiles only when > 0). Check `#define
   PHYSICAL` is a no-op at metalness 1. Measure low tier. Dials Deck.anisotropy +
   Deck.anisotropyRotation. Check chainShaderPatch / deck-breakup / rail-sheen still work.
4. Close #354 with SHAs after part 2.

## Open questions

- Left rim sheen is invisible under the white sky light on the deck. Accept, or raise rail gain?
  (owner, via supervisor)
- Pickup spots over holes (5.9%): accept, or fix? Cheap fix: per-pickup CPU "clear run" distance
  back to the nearest hole, packed in the instance matrix; the shader caps the spot's distance from
  the pickup to it. No stencil. (owner, via supervisor)

## Lessons → memory

- none this seam.
