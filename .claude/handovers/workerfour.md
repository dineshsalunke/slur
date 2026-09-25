Agent: workerfour · Lane: seamless sealed blocks (#264) · Updated: 2026-09-25

## Goal

Every sealed block shows a marigold seam on a face the player sees when approaching it.

## Done

- `9208d5b` (pushed to origin/dev): seam 0 always lands on the front (−z) face. The other seams are
  spread over the rest of the perimeter. Block depth is now in the `variationFor` cache key. There is a
  new test for the front-face seam.

## State

- Seeds 1–30, blocks with no seam on the front or inner side face. Before: weave 4886/21092, groove
  375/1803, score 6216/27500. After: 0 for all three. Measured in node with the renderer's functions.
- Live capture on :5173 `/test-level?gen=weave`, ship at x −6, z 636, frozen. Block 2112 draws dark in
  `.claude/frame-tap-refs/264-before.png` and shows a front seam in `264-after.png` (both gitignored).
- Gates: client vitest 364/364, client tsc clean, biome clean on my paths, comment ratchet OK.
- The cache-key change has no unit test. `variationFor` is module-private.
- My headless Chrome was killed by PID. No stray processes are left.

## Uncommitted

- none.

## Held files

- none. The lane is done and the three #264 files are released.

## Next

1. Wait for the supervisor.

## Open questions

- The owner said "longitudinal". Block seams are vertical stripes, so I read it as "no visible seam".
  The supervisor asked the owner. If they meant a lengthwise line on the block top, that is a new
  feature.
- With one seam, a block now always shows it on its front face. That leaves slightly less variety.

## Lessons → memory

`.claude/memory/koota-universe-reaches-the-page-world.md`: the resource-timing buffer is capped at 250.
