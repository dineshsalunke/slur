Agent: workerfour · Lane: #287 remove /pacing + DEFAULT_TRACK_GEN · Updated: 2026-09-26, evening

## Goal

Delete the /pacing board, prune shared pacing code that only it used, and add one `DEFAULT_TRACK_GEN = 'groove'`.
Done: #287 and #246 are closed.

## Done

- 2bc0292 — /pacing route deleted (60 files); ngrams.ts + test, REST_MIN_S and test-level route.constants.ts deleted;
  `DEFAULT_TRACK_GEN` in sim/space.ts, read by procgenDescriptor, run-room and /test-level; 45 test call sites
  now pass `'weave'` explicitly; obsolete memory `pacing-board-needs-cdp-not-screenshot-flag.md` removed (its
  MEMORY.md line went out with workerfive's fe85bcc, which committed the whole file).
- #287 closed with the SHA. #246 was auto-closed by the commit message, and I added a comment with the SHA.

## State

- At 2bc0292: typecheck clean; tests shared 403/403, server 53/53, client 446/446; lint shows 7 warnings, all
  pre-existing file-length warnings (measured).
- Headless check on :5173: `/`, a hosted room and `/test-level` each render a canvas with no console errors;
  `/pacing` returns 404 (measured).
- The rest of shared/pacing stays: `sim/score/emit.test.ts` calls `analyzeTrack`, which needs the whole analyzer.

## Uncommitted

None.

## Held files

None. All #287 claims are released.

## Next

1. Wait for the supervisor.

## Open questions

- Known leftover: an omitted `gen` still reads as weave (makeProcgenTrack, schema.ts, track-gen.test). The landing
  BACKDROP omits gen and relies on weave honouring `blockDensity: 0`. Should the landing get an explicit gen, or
  should omitted gen switch to groove? (owner, via supervisor)
- Should `PACING_HULL_L` move to `TRACK_CONTRACT.shipHalfL`? (carried over)

## Lessons → memory

none
