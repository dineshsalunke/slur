Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-24, ~20:15 IST

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`.

## Owner is AWAY (from ~20:10), on remote control

Goal on return: open `/song-lab`, switch between many generated song tracks, and watch each one replayed
for all 5 classes. The plan is on issue #253 (last comment).
Owner decisions this evening:
- Workers commit to LOCAL dev by explicit pathspec without asking. No push, no merge.
- #244 APPROVED (relayed to workerthree).
- `/song-lab` is a new dev-only route. `/test-level` stays untouched.
- All 5 classes fly every track.
- The song work is a THROWAWAY experiment (memory `song-tracks-are-a-throwaway-experiment.md`). The only
  shared change allowed: an optional intensity-curve parameter on `composeScore`.

## Done this session

- 72948ae JJ motifs (workerone): 455 JJ over seeds 1–200, on 173/200 seeds. Digest 2694968437.
- 7f397d0 #253 steps 1–2 (workerfour): beat analysis (Believer 125.02 BPM, 106 bars, 1.92 s/bar;
  HIGH bars 28–44, 60–72, 88–96) + `/tapper`. The mp3 lives in gitignored `apps/client/.songs/`.
- 19:49 INCIDENT: workerfour's `pkill -f … -U 501 --` SIGTERMed the owner's app helpers + the Codex
  app-server + all dev servers. Main apps survived. Memory `kill-by-pid-never-pkill.md` (f16a56c). Owner told.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | (1) apply gen-score switch diff after #244 commits; (2) #253 song-lab pipeline: bundle type FIRST → variants → tracks → 5-class pilot runs → `.songs/lab/*.json` | cleared + dispatched ~20:12 | claims pending |
| workertwo | w2P:pF | #253 drum analysis: kick/snare/hat onset streams in `apps/client/tapper/beat-analysis*` | cleared + dispatched ~20:12 | claims pending |
| workerthree | w2P:pG | #244 commit (owner-approved) | committing ~20:11 | track.ts, merge-blocks.*, pocket.test.ts, GDD.md, DECISIONS.md |
| workerfour | w2P:pH | #253 `/song-lab` viewer + replay | dispatched ~20:12 at 6% | claims pending |

Watch for a claim collision: workertwo and workerfour both near `apps/client/tapper/` (the analysis vs the dev plugin).

## Sequenced

1. After #244: workerone's switch; then ADR-020 into DECISIONS.md (parked text + JJ amendment; delete the
   old "no two gaps … by construction" bullet); GDD §5.5 class table for #247.

## Open owner questions

- #251: maskable icon? Landscape notch safe-area? Device check pending (commits 97dc750, b58923f, a5cd9a2 local).
- Score rooms have no pickups (S4).
- PR #195 paused. Older: `git rm apps/client/app/game/net-debug-hud.tsx` + drop `--color-debug`; review #236.

## Uncommitted

none of mine.

## Next

1. Answer claims as they arrive; check collisions (tapper/ folder).
2. Make sure workerone's bundle type reaches workerfour before the viewer depends on it.
3. Before the owner returns: verify `/song-lab` myself on a scratch port, then write a short "how to open it" note.

## Lessons → memory

kill-by-pid-never-pkill.md (f16a56c); song-tracks-are-a-throwaway-experiment.md (1cca5dd).
