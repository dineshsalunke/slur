Agent: workerfive · Lane: frame-tap double write #172 → next boost 75% + motion blur (#269) · Updated: 2026-09-26 13:50

## Goal
Make the frame tap answer each request exactly once, so no timer can throw ERR_HTTP_HEADERS_SENT and kill
the dev server.

## Done
- 4a8e1a8 — fix(client): a frame tap answers once (#172). Pushed. #172 closed with the SHA.

## State
- Root cause reproduced in a unit test before the fix: the deadline fires while an upload body streams, and
  `'end'` re-arms settle on the dead entry. The second `done` threw ERR_HTTP_HEADERS_SENT.
- The fix: a `settled` flag in `done`, a `res.headersSent` early return in `json`, a 410 for an upload that
  ends after its tap settled, and try/catch around the file write (answers 500).
- `frame-tap-plugin.test.ts`: 18/18 pass. Biome and the comment ratchet are clean on both files.
- Client `tsc` fails in workertwo's held files (net-canvas, test-level-canvas, test-level-hud,
  net-pilot-readout). The failures are not from #172.
- No live tap against :5173 [unmeasured]. The fix is covered by unit tests only.

## Uncommitted
- none

## Held files
- none. Next lane: packages/shared/src/combat/constants.ts (supervisor cleared it).

## Next
1. #269: set BOOST_GAIN to 0.75 in packages/shared/src/combat/constants.ts:64, fix the tests, rebuild the
   shared dist, and comment the SHA on #269.
2. Motion blur: weigh ≥5 options, measure frame cost (perf-analysis skill, headless DPR 1), and send the
   plan to the supervisor. Build nothing yet.

## Open questions
- none

## Lessons → memory
- none
