Agent: workerone · Lane: #227 remainder — sky review cleanup · Updated: 2026-09-26 12:20

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Close out the review items left on #227 (findings: `.claude/phases/2026-09-23-review-pr-221-224.md`). Owner
said GO. The worker closes the issue when it is done.

## Done

- 3948541 #258 shipped earlier (closed by the supervisor).
- (a) ADD planet/moon counts, (b) ADD missing-rock-map claim, (c) nbGlobe fwidth order: all already in c99c40d
  (git blame on docs/ADD.md:214, :283-284 and nebula-shaders.ts:170-171). No edit needed. The `sinR <= 0`
  return at :165 reads a uniform, so it is uniform control flow.
- (d) Bake time measured (below). Script: scratchpad `bake-time.mjs url port`.

## State (measured unless marked)

- Headless DPR 1, ANGLE Metal, Apple M1 Pro, :5173/test-level, 1280x633. NebulaBaker.update wrapped with
  gl.finish() before and a sync readPixels after:
  bake + relight median 112.2 ms (109.4–115.5, n=8) · relight only median 13.6 ms (13.0–18.3, n=8) ·
  field bake ≈ 98 ms [inferred, difference] · idle update 1.1 ms · first-load frame 387 ms (includes every
  shader compile, not bake-only).
- (e) dev still: scratchpad `shots/dark-q-dev-59529e8.png` (spawn pose, KeyP freeze). Mean luma by band:
  sky 22.5 · mid 29.3 · deck 21.4. Script: scratchpad `still.mjs url port out.png`.
- (e) 036645c still: NOT taken. It needs an old build served on a second port, which the owner's one-stack
  rule forbids. I asked the supervisor for an exception (or an old still).
- Scratchpad = `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/ac1ed156-baed-404d-aed3-9cecbbad8dbc/scratchpad/`.

## Uncommitted

None.

## Held files

None.

## Next

1. #227 CLOSED 2026-09-26 with the full comment. (e) old still skipped by owner decision (option 3): graphite, deck, blocks and lighting changed since 036645c, so a pair cannot isolate the sky. Idle until the supervisor assigns a lane.

## Open questions

none

## Lessons → memory

none
