Agent: workerfive · Lane: sci-fi SFX + score #267 · Updated: 2026-09-26

## Goal

Replace the cartoonish SFX with grounded sci-fi sounds and add a background score. DONE. #267 is closed.

## Done

- ab12a98 feat(audio): 13 picks built and pushed to origin/dev. #267 closed with a summary comment.
- Owner answers applied: Opus in .ogg · jump B · bolts 9/57/61 s (75 s dropped) · engine class values as planned · boost unbound.

## State

- Gates at ab12a98: `pnpm lint` passed (7 warnings, none in audio), client typecheck clean, client vitest 401/401 in 54 files (measured).
- All 27 audio files decode in headless Chrome at their exact lengths (measured). Safari 27.0 is installed; Ogg Opus is supported from 18.4 (WebKit notes). Safari itself was not driven [unmeasured].
- Bolt pick: 75 s is nearest to both 9 s and 61 s on spectral centroid/flatness/rolloff (measured).
- Cut peaks after gain: 0.496–0.947. The "locked" tone was 0.046 in the source and was raised ×10.87.
- Not ear-checked in a live room. Pass-by, the remote engine rate/filter and the lock loop are [unmeasured] in play.
- Departures from the plan: movement cues (jump, land, brake, pass-by) are on the `engine` bus, so they duck only the music. Non-trigger mine bursts play at 0.6× gain. The lock-loop helper is a new `loop-voice.ts`, not part of `audio-engine.ts`.

## Uncommitted

- none

## Held files

- none. Release: `apps/client/app/audio/**`, `apps/client/public/audio/**`, `docs/AUDIO.md`, `docs/DECISIONS.md`, `CREDITS.md`.

## Next

1. Wait for a new lane from the supervisor.
2. If asked to follow up #267: file an issue for the 16 unchosen events and Q4–Q6, and do a live-room ear check.

## Open questions

- The 16 unchosen events (the list is in #267). Q4 Freesound account vs previews. Q5 seeker miss/derez. Q6 Sonniss.

## Lessons → memory

- `.claude/memory/decode-audio-in-headless-chrome.md`
