Agent: workerfour · Lane: seamless sealed blocks (#264) · Updated: 2026-09-25

## Goal

Every sealed block shows a marigold seam on a face the player sees when approaching it.

## Done

- #262 landed earlier (`f5804af`).
- #264 filed. Cause, fix plan and claims were sent to slur-supervisor.

## State

- Cause: `sealedBlockSeams()` in `apps/client/app/game/scene/sealed-block-variation.ts` hashes 1–3 seams
  onto the whole perimeter. Nothing makes one land on the front (−z) face or the inner side face.
- Seeds 1–30, blocks with no seam on the front or inner side: weave 4886/21092 (23%), groove 375/1803 (21%),
  score 6216/27500 (23%). Measured in node with the renderer's functions. Not yet confirmed live.
- The rate is flat across block sizes. Fractured blocks are not affected.
- The `variationFor` cache key in `track-blocks.tsx` leaves out block depth.
- Measure script: `seamfaces.ts` in the session scratchpad. Run it with `apps/server/node_modules/.bin/tsx`
  from `apps/client`.

## Uncommitted

- none.

## Held files

- Claimed, waiting for "clear": `sealed-block-variation.ts`, `sealed-block-variation.test.ts`,
  `track-blocks.tsx` (all under `apps/client/app/game/scene/`).

## Next

1. Wait for the supervisor to say "clear".
2. Put seam 0 on the front-face span [4b+2a, 4b+4a], kept off the corners. Add depth to the cache key.
   Add the tests.
3. Re-run the count and expect 0. Take one headless before/after capture on :5173, then kill it by PID.

## Open questions

- The owner said "longitudinal". Block seams are vertical stripes, so I read it as "no visible seam".
  The owner needs to confirm that.

## Lessons → memory

none
