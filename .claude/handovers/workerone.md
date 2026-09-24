Agent: workerone · Lane: #253 song lab — `conductor` variant (14th) · Updated: 2026-09-24 23:59

Older versions of this file hold earlier #253 and #250 history (`git log -p -- .claude/handovers/workerone.md`).

## Goal

- Add a 14th variant `conductor`: the moves follow a conductor's 4/4 pattern (DOWN, IN, OUT, UP). Freighter is the
  reference. Keep all 5 classes in the build. Judge by the perfect pilot. Human drift does not matter.
- Owner: "we are not making a rythm game ... only building this with a song, is so that i can visualize and
  experience the moves".

## Done

- `61063be` Song clock anchored at freighter cruise: t0 = 0, z0 = `cruiseZ(freighter)` = 257.3, 124 u/s.
  `LabSong.clock` in the bundle. Placement starts at `gridStart(c)` = 260. Perfect-freighter drift 0.000 beats.
- `f194d47` handover for that.
- Conductor: design measured and approved by the supervisor (CLEAR). **No code written yet.**

## State

- Durations incl. register gap at 124 u/s, in beats (1 beat = 0.4799 s = 59.5u): l 2.02 · L 2.35 · held > 2.69 ·
  J 2.35 · tap j 2.02 · rest 1.01. Tight floors: l 80u, L 100u, > 120u.
- Freighter, perfect: J takes off 21–23u before its note z and lands 41u after. A tap j lands 37u after
  (measured on groove + kick-jump). Interceptor: J lands 32u after, tap 27u after.
- One 2-bar cycle = 8 beats = 476u. J+L+L = 420u fits, but the DOWN jump and its gap fill beats 0–1.66. So IN
  on beat 2 plus L (2.35) ends at 4.35, past OUT's downbeat (beat 4).
- Hash of the 13 existing variants (jq `[.variants[] | {id, score, runs:[.runs[]|{inputs,result}],
  humanRuns:[.humanRuns[]?|{inputs,result}], trackDigest, scoreString}]` | shasum -a 256) =
  `809ff7fd629eec5bbbcae25e531f60108d271714a61866d4bf37f66f0f7815a5`. It must be unchanged after the build.
- Believer per 2-bar cycle, strong (≥ 0.5) kick+snare hits: verse (bars 4–20) ~5–8 per bar, so staccato.
  High sections 0–5 per 2 bars, so mostly legato. All sections start on multiples of 4 bars.
- Bars with energy < 0.2: only 103 (0.15), 104, 105, the ending.

## Approved design (supervisor CLEAR, half-time: one stroke = 2 beats, one pattern = 2 bars)

- Cycle = bars b, b+1 (b even from the section start). Phrase = 4 bars = 2 cycles.
- DOWN = a J landing on beat 1 of bar b: J note z = round20(zAt(bar b) − 41). A staccato cycle's UP is a tap j:
  round20(zAt − 37), and its z is pushed to `taps`.
- OUT onset = snapUp(zAt(bar b+1)), anchored. IN wants snapUp(zAt(bar b + 2 beats)). If the IN note does not end
  before OUT, it moves EARLIER to OUT.z − dur, but never before the end of the DOWN jump's gap (p.z). If none fits,
  IN downsizes (held → L → l). If even l does not fit, OUT slides late. Count **inEarly** and **outLate**; the supervisor
  wants both counts. Never cut the register gap.
- The OUT size must leave room for UP: the largest candidate with OUT.z + dur ≤ UP.z.
- Size: quiet l/r, loud (label high) L/R. The first cycle of each 4-bar phrase goes one size up (quiet → L,
  loud → accented !L). Legato cycle (≤ 2 strong hits in the 2 bars): held < >. Staccato (≥ 7): accented snaps
  plus a tap UP. Report the counts.
- IN = left (−), OUT = right (+). Keep |x| small: pick the OUT size that keeps |x| ≤ 2 cells, or else minimises |x|.
  Obey SCORE_LINE_LIMIT.
- Echo (high sections, 2nd cycle of each phrase): DOWN · IN · J on OUT's onset slot · j landing on the next downbeat.
- Prep: before each high section, 4u sealed rails at line ± CALM_TUBE_HALF over
  [max(z_up − 60, OUT.z + moveZ(OUT) + SCORE_GATE_Z), z_up]. A ground doorway before the takeoff, never over a hole.
- Fermata/cutoff: from the first bar with energy < 0.2, no moves. The open emitter runs from snapUp(zAt(that bar))
  to the end. The last UP lands on that downbeat.
- Bundle: optional `LabVariant.stage?: { open: [z0,z1][]; rails: [z0,z1][] }`. `labEmitted(score, emit, stage?)`:
  corridor segments, `openSegments(score, corridor.spans)[i]` inside open ranges, then rail boxes appended per
  segment with `blockId(i, blocks.length)` and kind 'sealed' (a plain segment becomes 'block'). The line at z comes
  from the corridor spans. `labTrack`/`labDigest` take `Pick<'score'|'emit'|'stage'>`. `VariantBuild.stage?`.
  song-lab-build writes `stage` only when it is present. The viewer's `labTrack(v)` picks it up with no change.
- Pattern: follow `groove.ts` (`placeCue`, `padTo`, `fitUnit`, `beatLen`, `barTime`, `tapNote`). New file
  `song-lab/conductor.ts` exports `CONDUCTOR_VARIANTS`, appended in `variantsFor` after GROOVE_VARIANTS.

## Uncommitted

- None.

## Held files

- CLEAR for conductor: NEW `apps/client/song-lab/conductor.ts`, plus `bundle.ts`, `song-lab-build.ts`,
  `variants.ts`, `song-lab.test.ts` (all in apps/client/song-lab/), and the ignored bundle.
- Still held: `apps/client/song-lab/**` · `packages/shared/src/sim/score/*`.

## Next

1. Write conductor.ts plus the bundle `stage` support. Add tests: conductor replays from JSON; UP landings sit
   within ±0.2 beat of downbeats; old variants unchanged.
2. **Do NOT overwrite `.songs/lab/believer-s1.json`** (workerfour live-checks it). Build to a side path:
   `node song-lab/song-lab-cli.ts .songs/imgaine_dragons-believer.analysis.json --seed 1 --name believer-s1.next`.
   Swap it in only when the supervisor says go.
3. Verify on the side file: 280/280 replays, 14/14 digests, old-13 hash = 809ff7fd…
4. Measure the landing error vs downbeats and the stroke onset offsets on the perfect freighter. The scratchpad
   probes (drift.ts, jumps.ts, replay.ts) are session-local, so rewrite them if they are gone.
5. Report to the supervisor: SHAs, the note string for bars 0–8 and 28–36, pro/club/rookie deaths, the inEarly and
   outLate counts, and the legato/staccato/echo counts. Say when the bundle is ready so workerfour can check it.

## Open questions

- Owner: groove vs groove-tight; Believer curve lateral vs height (still open).
- Human runs drift behind the song on bumps: should the viewer re-sync? [inferred, not asked]

## Lessons → memory

- none this seam.
