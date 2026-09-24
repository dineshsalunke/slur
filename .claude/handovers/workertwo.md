Agent: workertwo · Lane: song-lab step 1, drum analysis (#253) · Updated: 2026-09-24 20:15

## Goal

Extend `apps/client/tapper/beat-analysis*` with band-split drum onset streams (kick, snare, hats). Each
onset has a time, strength, beat and bar. workerone consumes the output.

## Done

- (this commit) feat(tapper): band-split drum onsets (#253).
  - New `tapper/drum-onsets.ts`. It runs a band STFT (kick 40–130 Hz, snare 180–4000 Hz,
    hats 7–11 kHz). Log flux detects the onsets. Linear flux, scaled to each band's p99 level,
    classifies them and removes leak between bands.
  - `SongAnalysis` gains `firstBarBeat` and `drums: { kick, snare, hats: DrumOnset[] }`. Existing
    fields are unchanged.
  - `DrumOnset = { t, strength (0..1 per band), beat (fractional index into beats[]), bar (index into
    bars[], -1 before bars[0]), inBar (0..<4) }`.
  - `beat-analysis.ts` now exports `HOP`, `WIN`, `ONSET_LAG_S`, `fft` and `detrend(raw, seconds?)`.
  - The CLI prints onsets per bar for each band.
- Output shape sent to workerone and the supervisor before building. workerone acked.

## State

- Synthetic kit (kick on 1+3, snare on 2+4) at 96, 125 and 140 BPM: kick and snare have 100% recall
  and 0 false positives, within 3 ms. With eighth-note hats added, kick and snare stay exact. The hats
  stream has 0 false positives and ~48% recall: hats under a kick or snare are masked.
- Believer (106 bars, 1.7 s run): kick 6.56/bar, snare 5.12/bar, hats 1.34/bar.
  At `strength >= 0.5`: kick 1.55, snare 1.14, hats 0.42 per bar.
- Believer is on a triplet grid. Share of onsets on triplet-8th slots (random is 37.5%): snare 86%,
  hats 70%, kick 50%. At `strength >= 0.5`: snare 96%, hats 93%, kick 74%.
- The kick band catches bass. Kick onsets land +15–19 ms late on Believer.
- `barPhase` (pre-existing) puts the downbeat on the loudest beat. On the synthetic kit that is the
  snare, so kick has `inBar` 1 and 3. Not changed: the supervisor asked for existing fields unchanged.
- `apps/client/.songs/imgaine_dragons-believer.analysis.json` has been regenerated with `drums`
  (gitignored).

## Uncommitted

None.

## Held files

None. The supervisor released all claims (lane closed).

## Next

1. Stay idle until the supervisor assigns new work.
2. Parked follow-ups (not approved): add a kick lag of about -15 ms; report a triplet or swing flag
   for each song.

## Open questions

None. Kick-aware `barPhase` was declined by the supervisor. A one-beat offset of the downbeat does not
change the feel, and workerone already consumes `bars`.

## Lessons → memory

- `.claude/memory/believer-is-on-a-triplet-grid.md`
