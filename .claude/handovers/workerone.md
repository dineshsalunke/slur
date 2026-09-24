Agent: workerone · Lane: #253 wind-down done → new beat-recording deck (plan only) · Updated: 2026-09-25

Older versions of this file hold the conductor and earlier #253 history (`git log -p -- .claude/handovers/workerone.md`).

## Goal

- Build a new dev route: a plain empty deck. The owner plays any mp3 and flies and strafes on the beats. The
  route records the inputs so we can learn what the owner means by moving to a song.

## Done

- `9388a67` removes song-lab and tapper from `dev` and reverts c3d2a63 (the score intensity curve). The
  archive is the local branch `archive/song-lab` → `b64766f`. It is **not pushed**.
- I deleted `apps/client/.songs/lab/` (ignored data). The mp3 and `imgaine_dragons-believer.analysis.json`
  stay, as the supervisor said.

## State

- Score digest over composeScore + emitScore, seeds 1–30: `62f2711c…3efc` before and after the undo.
  Adherence is 1.0000 on all 30 seeds. The scratch probe was `digest.mjs`.
- Gates at `9388a67`: typecheck green · lint green · shared 316/316 · server 17/17 · client 297/299.
- The 2 failures are in `app/net/matchmaking.test.ts`. The descriptor has more fields than the test
  expects. [inferred, not run at HEAD without this change] The cause is 0734e06 or later, because this
  change does not touch that code.

## Uncommitted

- None of mine.

## Held files

- None. The new route needs fresh claims after the owner approves the plan.

## Next

1. Send the new-deck plan to the supervisor. Wait for the owner's approval.
2. After the owner approves, file an issue, claim the files and build.

## Open questions

- Push `archive/song-lab` to origin? This is the owner's decision.
- The matchmaking test failures: which lane owns them?

## Lessons → memory

- none this seam.
