Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-24, ~21:30 IST

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear can still show the old percent, so read again.

## Owner is AWAY (from ~20:10), on remote control

Goal on return: open `/song-lab`, switch between many generated song tracks, and watch each one replayed
for all 5 classes. The plan is on issue #253 (last comments).
Standing owner decisions:
- Workers commit to LOCAL dev by explicit pathspec without asking. No push, no merge.
- `/song-lab` is a new dev-only route. `/test-level` stays untouched.
- All 5 classes fly every track.
- The song work is a THROWAWAY experiment (memory `song-tracks-are-a-throwaway-experiment.md`). The
  allowed shared change: an optional intensity-curve parameter on `composeScore` AND `emitScore`
  (with no curve passed, output must be byte-identical; digest + seeds 1–30 adherence unchanged).
- The bundle must store each variant's curve so the viewer's rebuild matches (trackDigest).

## Landed this session (all local, not pushed)

- 72948ae JJ motifs · 0734e06 gen:'score' switch (`SLUR_TRACK_GEN=score pnpm dev`) · 59ee8df #244 ·
  333530e ADR-020 + GDD §5.5 · 7f397d0 beat analysis + /tapper · 4f84bbe drum onsets (Believer is on a
  triplet grid) · 0099d73 bundle type + replay loop · 790c6cb, bf70803, 67a2dfa /song-lab viewer.
- Issues filed: #253 (song lab), #254 (class rework: Freighter should NOT be fastest; later).
- 19:49 pkill incident; memory `kill-by-pid-never-pkill.md`. Owner told.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #253 pipeline DONE: c3d2a63 curve, b5b7b3c pipeline, handover ae61282. Bundle `.songs/lab/believer-s1.json` = 10 variants × 5 classes, all replay-verified; perfect pilot → 50/50 finish, 0 deaths, 0 bumps (times don't separate variants; 65–151 notes do). Human runs LANDED f98f9e5 (handover 639655e): pro/club/rookie, 150 runs, 0 replay mismatches; bundle 16.7 MB. Deaths pro/club/rookie: drum-driven variants easiest (snare-jump 1/15/38, triplet-grid 1/14/39), `mined` hardest (12/44/103). IDLE | none | apps/client/song-lab/**, score/compose.ts + test, score/emit.ts + test, client package.json + vitest.config.ts (1 line each) |
| workertwo | w2P:pF | none | cleared + resumed idle (d688b79) | none |
| workerthree | w2P:pG | none | cleared + resumed idle (9674c9f) | none |
| workerfour | w2P:pH | #253 /song-lab viewer DONE: bf70803, 67a2dfa, ddf5bfe, 63b8014 (pilot picker); handover e8ec4dc. 200/200 MATCH, 10/10 digests, load 0.64–0.71 s warm. Owner's return goal is MET. Song playback DONE ab88019 (handover dcf4e46): 1× only, re-seek > 80 ms. Drift from map.ts songClock zPerSecond = registerCruise 124 (= freighter only): finish lag freighter 2.1 s, comet 22.7, fighter 60.4, phantom 78.0, interceptor 97.9. OWNER QUESTION pending: per-class map vs one reference speed. Not heard on real speakers yet | IDLE | routes/song-lab/**, tapper/tapper-plugin.ts, 1 line routes.ts |

## Next

1. /song-lab is ready (all four workers idle). The owner has the how-to message. Take the owner's
   feedback on which variants feel right → step 3/distil, or #254, or the intensity-strip extra.

## Open owner questions

- #254 class roles (later). GDD class-matrix Comet "fastest" wording.
- #244 dropped 94 fractured blocks over 9 seeds; FRACTURE_RATE unchanged. Raise it?
- #251: maskable icon? Landscape notch safe-area? Device check pending (97dc750, b58923f, a5cd9a2).
- Score rooms have no pickups (S4).
- PR #195 paused. Older: `git rm apps/client/app/game/net-debug-hud.tsx` + drop `--color-debug`; review #236.

## Owner's dev stack

The supervisor started `pnpm dev` (background task in its session) at ~21:39: client :5173, server :2567
(pid 85262). A /clear of the supervisor may end it; tell the owner to restart `pnpm dev` if so.

## Uncommitted

none of mine.

## Lessons → memory

kill-by-pid-never-pkill.md (f16a56c); song-tracks-are-a-throwaway-experiment.md (1cca5dd).
