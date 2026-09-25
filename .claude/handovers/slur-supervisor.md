Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-25, ~08:05 IST

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again.

## Standing owner decisions

- Workers commit to LOCAL dev by explicit pathspec without asking. The owner approved pushing dev to origin
  this morning ("merge them on dev and then sync everything").
- The song work is a lens, not a rhythm game (memory `song-tracks-are-a-throwaway-experiment.md`, 82137b9).
  Never propose audio re-sync or timing scores.
- Freighter-only while experimenting. Other classes come after a good result.

## What happened (2026-09-24 night → 09-25 morning)

- Song lab: the freighter sync worked (live drift ≤16 ms). `conductor` variant db8cd1e. Then the owner said "this is
  not really working out". EVERYTHING removed from dev at 9388a67 (71 files), including /tapper and the
  c3d2a63 curve revert (score sha 62f2711c unchanged). Archived on LOCAL branch `archive/song-lab` (b64766f),
  not pushed; the owner has not said whether to push it.
- matchmaking.test.ts stale fixture fixed c0a7a90 (workertwo).
- /beat-deck v1 1ab0a3f (workerone): an empty deck; the owner flies to an mp3; takes are written to
  apps/client/.songs/takes/. Believer mp3 + imgaine_dragons-believer.analysis.json are kept. A bot take
  (…2026-09-24T19-21…) is still there; delete it before any analysis.
- The supervisor analysed the owner's 4 takes (jq; scripts in the old session scratchpad, gone): strafe every 2 beats
  (then 1), 70–80% L/R alternation, holds of 0.5–1 beat, jumps on the beat (−10..−16 ms), strafes 40–100 ms early,
  take 4 tightest. The owner will record new songs later. The beat-analysis script lives only on archive/song-lab.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | PLAN (no build): track generator derived from the takes, playable in /test-level. Owner: "doesn't feel like a corridor … combat game between friends … a lot of open space lateral and longitudinal". The plan must cover the grammar distributions, an open-space metric, the TrackGen/schema impact, 30-seed × 5-class pilot proof, claims, and the issue | planning | none |
| workerthree | w2P:pG | SYNC: detached worktree ../slur-worktrees/sync off local dev. Merge origin/dev (17 behind: #188 #225 #230 #237), then merge PR #195 feat/ship-feel (CONFLICTING), gates, `push origin HEAD:dev`. STOP on semantic conflicts | dispatched ~08:00 | worktree only |
| workertwo | w2P:pF | none | idle (87524f6) | none |
| workerfour | w2P:pH | none | idle, stood down (8e62847) | none |

## Next

0. SYNC DONE ~08:35: workerthree pushed 277396f. The supervisor merged origin/dev into the shared dev and pushed; dev == origin/dev.
   workerthree is idle (6335e0f). If the owner's dev stack acts up, restart `pnpm dev` (new scene files came in).
   Earlier: workerthree (f1669e1) found the sync merge 277396f clean and green. #195 is SEMANTIC: rail bounce is dead after
   fc65986 (ships fall off edges), banking writes to the deleted dev/tunables.ts, engine bloom was tuned before threshold 0.6.
   Owner options A (drop the rail bounce), B (port only the engine glow and retune it for 0.6), C (close #195). Relayed. refs/remotes/pr/195 is kept.
   ../slur-worktrees/merge-195 belongs to workerfour (stale); ask whether to remove it.
1. When workerthree reports the push: check `git status` in the shared tree. When the index is clean,
   `git merge --ff-only origin/dev` in the shared checkout (never while a worker has staged files). Confirm that
   `gh pr view 195` shows it merged. Tell the owner.
2. workerone's 'groove' TrackGen plan (~08:15) has been RELAYED to the owner. Waiting on (i) the name, (ii) high energy = fewer strafes + more jumps,
   (iii) partial vs full-width gaps (supervisor recommends partial), (iv) /test-level default vs ?gen=groove. On approval, clear its
   claims (new packages/shared/src/sim/groove/**, space.ts, track.ts, test-level-canvas.tsx, beat-deck/extract-grammar.mjs).
   Check test-level-canvas.tsx does not collide with workerthree's #195 merge first.
3. Ask the owner: push archive/song-lab?

## Open owner questions

- Push archive/song-lab?
- #254 class roles (later). #244 FRACTURE_RATE raise? #251 device check. Score rooms have no pickups.
- Older: `git rm apps/client/app/game/net-debug-hud.tsx` + drop `--color-debug`; review #236.

## Owner's dev stack

The previous supervisor session started `pnpm dev` at ~21:39 (server pid 85262, :2567; client :5173). It was still
serving at 07:40.

## Uncommitted

none of mine. docs/art-direction/* changes are ChatGPT's; never touch them.

## Lessons → memory

song-tracks-are-a-throwaway-experiment.md updated (82137b9).
