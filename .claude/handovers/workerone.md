Agent: workerone · Lane: #288 one run path · Updated: 2026-09-26 (slice 4 verified live; lane done)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

/test-level and hosted rooms differ only in netcode. Shared `stepCombat()`, and no `Local*` duplicates.

## Done

- dab29d4 slice 1, 268dcb2 slice 2 (shared RunSim), d39de1c slice 3a (RunRoomLike), a79bfc3 slice 3b (LoopbackRoom).
- 5336f7e slice 4: /test-level on the loopback room, dev layer in test-level-dev/, Local* deleted.
- Live check on /test-level (headless Playwright, DPR 1, muted, owner's :5173). No code change needed.
- Memories updated to the loopback hooks (commit with this handover).

## State

- Measured at 5336f7e: typecheck + lint clean; shared 422/422, server 38/38, client 437/437.
- Live, verified 2026-09-26 on /test-level (split-crown unless noted):
  - Flight: W to vz 88 in 3 s; Space jump y 1.16, grounded false. Client z tracks server z within one patch.
  - Pickup: ship on pickup 0 (x −4.22, z 130) → taken 1, slot = seeker.
  - Bolt, seeker, mine, boost, shield: each fires from slot 0 and shows on the decoded client state. Boost vz 47 → 143, timer 1.8 s. Shots show boost blur, shield dome, seeker hit.
  - Rear-view panel and HUD render. HUD hides in PHASE.finished (3 frames before the restart), as expected.
  - Audio: AudioContext `running` after the first click. Not heard [unmeasured by ear].
  - Touch (844×390, pointer coarse): 7 pad buttons; Throttle hold → vz 43 in 1.5 s.
  - KeyP: z and elapsed hold for 1 s; unfreeze resumes with no catch-up.
  - Shift+3 mid-race: phase racing at +100 ms, ship `bob`, z 0 → 83.6 at +1.6 s. No streak in the shot.
  - Auto-restart: finish at z 8401.6, restart 3 frames later, racing from z 0.
- Found and fixed a stale `packages/shared/dist/run/run-sim.js`: `startRace()` still used `COUNTDOWN_SECONDS`, so every start ran a 3 s countdown. `tsc -b --force` fixed it. dist is gitignored; nothing to commit.
- `bob` (Comet, halfL 0.59) looks small in frame. Same chase camera for all classes; not a regression.
- Pre-existing noise: `[track-floor] seg N span not CELL-aligned` console warnings (not this lane).

## Uncommitted

None after this commit.

## Held files

None after the push. Released: routes/test-level/**, game/net-canvas.tsx, game/net-loop/*, net/loopback-room/*, run-sim.ts + test.

## Next

1. Push (ff-only), `gh issue close 288` with the SHAs.
2. Report to slur-supervisor; take the next lane.

## Open questions

- None.

## Lessons → memory

- Updated: place-the-ship-over-cdp, stage-a-mine-on-test-level, koota-universe-reaches-the-page-world (loopback hooks).
- Extended: shared-watcher-can-leave-dist-stale (a stale dist fakes a live-check failure; grep dist first).
