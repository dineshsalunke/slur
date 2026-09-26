Agent: workerfive · Lane: sci-fi SFX + score #267 · Updated: 2026-09-26

## Goal

Replace the cartoonish SFX with grounded sci-fi sounds, and add a background score. The owner picks on an audition page, and then I build.

## Done

- Filed #267 with the shortlist. A comment on #260 marks its cartoon direction as superseded.
- The owner posted 13 picks on #267 (comment 5843537599).
- The build plan for those 13 went to the supervisor (2026-09-26). It is not built.

## State

- Shortlist audition page: `<scratchpad>/audition/index.html` (103 rows; all 98 URLs answered 206).
- Proposed cuts: `<scratchpad>/cuts/out/*.ogg`, playable on `<scratchpad>/cuts/index.html`. The scratchpad is session-local and does not survive this session. The cut points are in the plan below, so the files can be re-rendered.
- Cut points, measured from ffmpeg RMS envelopes (50 ms) on the 128 kbps previews:
  - engine 10.0–16.0 s + 0.3 s crossfade
  - boost 29.0–31.0 s
  - brake: hiss 0–0.9 s + whoosh 60013 at 0.7×
  - jump: A = head 0–0.5 s; B = the whole riser at atempo 6.8×
  - land 0–0.8 s
  - bolt: shots at 9 / 57 / 61 / 75 s, 0.4 s each
  - hit 0.38–1.60 s
  - seekerFire 0–1.6 s
  - seeker locking 0–0.5 s, locked 3.55–4.25 s
  - seekerHit 0–3.2 s
  - mineBurst: whole file
  - passBy 0.15–2.4 s
- All 17 SFX cuts at Opus 64 kbps mono: 192 KB total (measured).
- The local ffmpeg has no libvorbis, only libopus and libmp3lame (measured).
- Boost has no mechanic and no duration in @slur/shared. GDD §5.1 makes it a planned pickup.
- Race music: Vector Racing, 110.8 s, 256 kbps, 3.55 MB [research agent measurement; my OGA download stalled].

## Uncommitted

- none

## Held files

- none. The claims are listed in the plan and are not granted yet.

## Next

1. Wait for the owner's answers:
   - format: Opus after a Safari check, or vorbis-tools
   - jump: A or B
   - which 3 bolt shots
   - the engine class pitches
   - whether boost ships unbound
2. Send the claims, then build:
   - `engine-loop.ts` + `engine-voice.ts` replace `engine-hum.ts`
   - the remote engine gets a filter and rate
   - `movement-edges.ts`: jump, land, brake, pass-by
   - `bind-room-audio`: seeker fire, lock, hit, and mine burst
   - `CREDITS.md`, ADR-021, `AUDIO.md`

## Open questions

- The 16 events that are still unchosen (#267 comment).
- Q5: build seeker miss and derez, or synthesize them?
- Q6: download Sonniss?

## Lessons → memory

- none
