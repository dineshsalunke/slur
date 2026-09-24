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

## Owner decision ~23:35: FREIGHTER ONLY

"for now we will only test this with freighter, if the experiment gives good result we will then continue with
other classes and features or fixes". Sync fix = option 1: the song starts when the freighter reaches cruise
(notes at z = zCruise + 124·t). No physics change and no per-class maps. Dispatched: workerone does map +
bundle, workerfour does the viewer (audio start, readout origin, bar-106 stop, freighter default). Target:
drift < 1 beat at bars 8/28/60/96/finish.
- Field: LabSong.clock {z0 257.3 (freighter cruise at tick 248, 4.133 s), t0 0, zPerSecond 124}.
- workerfour viewer DONE 9b3ab59 (handover 50c2a1a), cleared + resumed ~23:55. It waits for workerone's
  bundle SHA and then runs the live drift check. Send it that SHA.
- workerone DONE 61063be (handover f194d47): perfect-freighter drift 0.000 beats at every checkpoint on all
  13 variants (bundle analysis). 260/260 replay match. groove.ts gridStart = 260. IDLE, holds nothing.
  Human freighter drifts after bumps (pro −5 beats by bar 96; rookie −350 to −520 at the finish).
  The re-sync question is DROPPED. Owner: "we are not making a rythm game"; the song only helps the owner see the moves
  (memory updated 82137b9).
- ~00:15 workerone dispatched: 14th variant `conductor` (4/4 pattern down-in-out-up, landing on the
  downbeat, half-time, size = loudness, legato/staccato, prep beat, fermata = open stretch).
- workerfour dispatched ~00:05: LIVE drift check (audio clock) on groove/groove-tight/envelope, plus one pro run.

## Landed this session (all local, not pushed)

- 72948ae JJ motifs · 0734e06 gen:'score' switch (`SLUR_TRACK_GEN=score pnpm dev`) · 59ee8df #244 ·
  333530e ADR-020 + GDD §5.5 · 7f397d0 beat analysis + /tapper · 4f84bbe drum onsets (Believer is on a
  triplet grid) · 0099d73 bundle type + replay loop · 790c6cb, bf70803, 67a2dfa /song-lab viewer.
- Issues filed: #253 (song lab), #254 (class rework: Freighter should NOT be fastest; later).
- 19:49 pkill incident; memory `kill-by-pid-never-pkill.md`. Owner told.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone (NOW ~22:00, cleared + dispatched) | w2P:pD | OWNER FEEDBACK: timing/feel good; track is "just a corridor"; strafing too simple. New variants: (1) signature intro groove `L R L R L R r l r l r ×2` on kick/snare; (2) "Believer" hook = a PAIR: full move, then a shorter echo: normal jump → short tap jump, OR long held strafe → short snap; alternate the two forms (owner clarified ~22:10; lab-only tap-jump token); (3) open stretches: islands/gates, not continuous walls. LANDED bcbc3d5 (handover 657c10e): 13 variants (groove, groove-tight, groove-open), 260/260 replay match, old 10 byte-identical. Human deaths pro/club/rookie: groove 0/1/6, tight 0/1/2, open 0/0/8. Cleared + resumed ~23:25, waiting idle. Owner Qs: register gap vs backbeat grid; Believer curve lateral vs height | none (committed) |
| workerone (earlier) | w2P:pD | #253 pipeline DONE: c3d2a63 curve, b5b7b3c pipeline, handover ae61282. Bundle `.songs/lab/believer-s1.json` = 10 variants × 5 classes, all replay-verified; perfect pilot → 50/50 finish, 0 deaths, 0 bumps (times don't separate variants; 65–151 notes do). Human runs LANDED f98f9e5 (handover 639655e): pro/club/rookie, 150 runs, 0 replay mismatches; bundle 16.7 MB. Deaths pro/club/rookie: drum-driven variants easiest (snare-jump 1/15/38, triplet-grid 1/14/39), `mined` hardest (12/44/103). IDLE | none | apps/client/song-lab/**, score/compose.ts + test, score/emit.ts + test, client package.json + vitest.config.ts (1 line each) |
| workertwo | w2P:pF | none | cleared + resumed idle (d688b79) | none |
| workerthree | w2P:pG | none | cleared + resumed idle (9674c9f) | none |
| workerfour | w2P:pH | #253 /song-lab viewer DONE: bf70803, 67a2dfa, ddf5bfe, 63b8014 (pilot picker); handover e8ec4dc. 200/200 MATCH, 10/10 digests, load 0.64–0.71 s warm. Owner's return goal is MET. Song playback DONE ab88019 (handover dcf4e46): 1× only, re-seek > 80 ms. Drift from map.ts songClock zPerSecond = registerCruise 124 (= freighter only): finish lag freighter 2.1 s, comet 22.7, fighter 60.4, phantom 78.0, interceptor 97.9. OWNER QUESTION pending: per-class map vs one reference speed. Not heard on real speakers yet | 13-variant check DONE (handover fab0267): 13/13 digests, 260/260 MATCH, no code change; load 583–672 ms warm. Cosmetic open: song-bar readout counts past bar 106 after the song ends. IDLE | routes/song-lab/**, tapper/tapper-plugin.ts, 1 line routes.ts |

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
