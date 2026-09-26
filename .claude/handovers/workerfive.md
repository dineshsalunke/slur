Agent: workerfive · Lane: sci-fi SFX + score #267 · Updated: 2026-09-26

## Goal

Replace the cartoonish SFX with grounded sci-fi sounds, and add a background score. The owner chose 13 cues on #267 and approved the plan. BUILDING.

## Done

- Filed #267. The owner posted 13 picks (comment 5843537599).
- The owner approved the plan and the 5 answers (relayed by the supervisor, 2026-09-26):
  1. Format: Opus in .ogg via the local ffmpeg libopus. Safari check: the installed Safari is 27.0 (measured).
  2. Jump: B (the riser time-compressed).
  3. Bolt: use the 3 of 9/57/61/75 s that differ most. Report which one I dropped.
  4. Engine: the class values below, as they are.
  5. Boost: ship the cue unbound.
- Claims CLEAR: `apps/client/app/audio/**`, `apps/client/public/audio/**`, `docs/AUDIO.md`, `docs/DECISIONS.md` (ADR-021).
- After the push: `gh issue close 267 -c "<what shipped + SHA>"`, then report the SHA and gates to the supervisor.

## Plan (verbatim numbers)

ENGINE (one sample for all classes): `engine-loop.ts` replaces `engine-hum.ts`. Chain: looped buffer source → lowpass → gain → 'engine' bus. rate = lerp(0.7, 1.4, v) × pitch; cutoff = lerp(600, 6000, v) × bright; gain = lerp(0.25, 0.6, v). `engine-voice.ts`:
interceptor 1.15/1.2 · fighter 1.0/1.0 · comet 1.08/1.1 · phantom 0.95/0.7 · freighter 0.78/0.8.
Remote: same buffer 'engineLoop'; PositionalAudio.setFilter(biquad); a useFrame sets rate + cutoff per remote.

CUTS: engine 10.0–16.0 s + 16.0–16.3 tail crossfaded in (0.3 s tri) · boost 29.0–31.0 s, 50 ms in, 0.5 s out · brake hiss 0–0.9 s (fade 0.55–0.9) + whoosh 60013 at 0.7×, gain 0.8 · jump 3.4 s riser ×6.8 → 0.5 s; double jump rate 1.12 · land 0–0.8 s (fade 0.55–0.8), gain from |vy| clamped 0.4–1, rate 0.85 freighter · bolt 0.4 s shots, fade 0.28–0.4, 3 round-robin · hit 0.38–1.60 s · seeker launch 0–1.6 s fade 1.25–1.6 · locking 0–0.5 s looped (period 0.25 s); locked 3.55–4.25 s · seeker hit 0–3.2 s fade 2.4–3.2 · mine burst whole · pass-by 0.15–2.4 s fade 1.7–2.4 · music Vector Racing stereo Opus 96k, loop as is.
GAINS: 0.7–0.9; locking loop 0.5 on threat bus; pass-by 0.6.

HOOKS: bolt = projectiles.onAdd owner===me. hit = stunTimer rising edge. seeker launch = seekers.onAdd owner===me. lock = seeker targetId===me → locking loop; `committed` true → stop, play 'seekerLocked'; onRemove → stop (looped-voice helper in audio-engine). seeker hit = onMessage(SEEKER_HIT_MESSAGE). mine burst = onMessage(MINE_BURST_MESSAGE). jump/land/brake/pass-by: pure helper `movement-edges.ts` + test, driven from the game-audio useFrame. Brake = rising edge of max(keyboard, touch, gamepad brake), no currentInput() (it bumps seq), gate vz > 0.3×maxCruise, cut. Pass-by: |dx|<12 and 0 < dz/closing < 0.45 s, once per remote, re-arm at |dz|>20.

CREDITS: vedas 124099 CC BY 3.0; smcameron 51468 CC BY 4.0; sonicboom_sfx 223783 CC BY 3.0; Technodono Vector Racing CC BY-SA 4.0. CC0 rows for the rest. Remove Neon Laser Horizon.
Remove: laser_fire, hit_impact, boost, engine_loop.ogg, neon_laser_horizon.mp3.

## State

- Source previews + the first cuts are backed up at `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/469ab117-3ee3-402b-8588-c8760d2324fd/scratchpad/cuts`.
- The local ffmpeg has libopus and no libvorbis (measured in the earlier session).

## Uncommitted

- none

## Held files

- `apps/client/app/audio/**`, `apps/client/public/audio/**`, `docs/AUDIO.md`, `docs/DECISIONS.md`

## Next

1. Render the final cuts into `public/audio/`.
2. Code: engine-loop, engine-voice, remote engine, movement-edges (+test), bind-room-audio hooks.
3. Docs: CREDITS, ADR-021, AUDIO.md. Gates, commit, push, close #267, report.

## Open questions

- The 16 events that are still unchosen. Q5 seeker miss/derez. Q6 Sonniss.

## Lessons → memory

- none
