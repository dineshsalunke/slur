Agent: workerone · Lane: #327 weave with no funnel · Updated: 2026-09-27 (lane done, closed)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#327: remove the weave funnel (a 1u staircase). Owner picked B: lane walls start as a flat face, with a clear run-up from ship physics.

## Done

- #318, #320, #322, #323, #325: all closed (see git history of this file).
- #327: `7d52b75` (pushed). Issue closed with the SHA.
  - `weave-emit.ts`: `WEAVE_FUNNEL`, `weaveOpenness` and `weaveLanesAt` removed. `weaveLanes(spec)` gives fixed lanes. `weaveRunUp(spec)` gives the physics run-up. Posts run from `z0` to `z1`. The hole divider runs the full weave.
  - `pitch.ts`: `crossSeconds`/`classLead` take an optional start `x` (`from`). Calls without it do not change.
  - `plan.ts`: `set` = `max(PHRASE_ARENA_LEN, weaveRunUp)`.
  - `weave.test.ts`: `weaveTarget` aims at the lane from the run-up start. New tests: an edge-start sweep and the open run-up before each phrase weave.
  - Phrase digest row updated. DECISIONS.md: #327 amendment after the S3 weave amendment.

## State

- Run-up (u): low 220; mid 200 single / 180 parallel; high 168 single / 156–160 parallel. All < 280, so segment count is unchanged (744–766).
- Edge-start sweep: 5 classes × 7 shapes × 3 salts × 3 starts, 0 bumps and 0 deaths. At 25% run-up, 28/30 flights fail.
- Phrase seeds 1–30, band + avoid pilot: 0 bumps and 0 deaths in weaves for all classes. 1 Freighter bump in a twist motif, seed 4 z 8241. It is also present at HEAD `d48a5e4`. HEAD also had a seed 9 twist bump, which is gone now.
- Weave obstacles on the digest seeds: 1263 → 164.
- Shared 533/533, client test-level 65/65, typecheck 0, lint 0 errors (8 old warnings).
- Not viewed on /test-level by me [unmeasured]. Owner to check.

## Uncommitted

None of mine. `tug-line/*` + `tug-constants.ts` are workertwo's. `tracks/` is owner data.

## Held files

None. Lane finished.

## Next

1. Wait for the next lane from slur-supervisor.

## Open questions

- The seed 4 Freighter twist-motif bump (avoid pilot, present before #327). Is it worth an issue?
- #325: is the marigold sleeve too loud at distance (`PORTAL_ARMED_INTENSITY`)?
- #315, #308, `unionRects` order: still open from an earlier lane.

## Lessons → memory

`.claude/memory/weave-pilot-must-use-the-run-up.md`
