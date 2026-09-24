Agent: workerone · Lane: #253 song lab — `conductor` variant (14th) · Updated: 2026-09-25 00:10

Older versions of this file hold earlier #253 and #250 history (`git log -p -- .claude/handovers/workerone.md`).

## Goal

- 14th variant `conductor`: moves follow a conductor's 4/4 pattern (DOWN, IN, OUT, UP), half time. Freighter is
  the reference. All 5 classes in the build. Judge by the perfect pilot.

## Done

- `61063be` song clock anchored at freighter cruise.
- `db8cd1e` conductor variant + bundle `stage` (open ranges + rail ranges). `groove.ts` now exports `barTime`,
  `beatLen`. Tests: conductor replays from JSON and UP jumps land within ±0.25 beat of downbeats (echo Js
  excepted); a stage only appends sealed rails.

## State

- Side bundle `apps/client/.songs/lab/believer-s1.next.json` built from `db8cd1e`: 14 variants, replays 280/280,
  digests 14/14, old-13 hash `809ff7fd…` unchanged (jq -c form).
- **Swap NOT done.** Supervisor said GO. The auto-mode classifier denied both `mv` and backup-then-`cp` over
  `believer-s1.json` ("Irreversible Local Destruction"; the file is gitignored). Needs the owner.
- Conductor, perfect pilots: 0 deaths, 0 bumps, all 5 classes. Freighter 208.7 s.
- Human: pro Σd0 Σb9 · club Σd8 Σb181 · rookie Σd78 Σb573 (freighter rookie DNF, d23).
- Counts: cycles 51 · legato 16 · staccato 14 · plain 12 · echo 9 · inEarly 38 · inDownsized 12 · outLate 0 ·
  outDropped 0 · upLate 0 · prepRails 3 · taps 23 · fermata bar 103 · 155 notes.
- Freighter landings vs nearest downbeat: 62 = 51 cycle UPs + 1 fermata UP + 1 first DOWN + 9 echo J.
  Downbeat landings: 52/53 within ±0.2 beat, worst −0.217 (z 5174). Echo Js land 0.73–1.02 beat off by design. Median |err| 0.10.
- Stroke onsets vs half-bar grid: median +0.02, range −0.68 to +0.33 beat; 53/93 within ±0.2. The early ones
  are inEarly IN strokes.
- Landing distance varies 34–41u: the pilot picks the middle of its clearing takeoff window.
- Bars 0–8: `!L !R j !l !r j !L !R j l r J`. Bars 28–36: `J !L > J L J j < > J L J`.

## Uncommitted

- None in source. Ignored: `believer-s1.next.json` (awaiting swap).

## Held files

- `apps/client/song-lab/**` · `packages/shared/src/sim/score/*` · the ignored bundles.

## Next

1. Owner performs or approves the swap: `mv apps/client/.songs/lab/believer-s1.next.json apps/client/.songs/lab/believer-s1.json`.
2. Then workerfour re-checks live.

## Open questions

- Owner: allow the bundle swap (see State).
- Owner: groove vs groove-tight; Believer curve lateral vs height (still open).
- Legato IN rarely fits a held stroke (1.66→4 beats < 2.69): 12 downsized. Accept, or let IN start earlier?

## Lessons → memory

- none this seam.
