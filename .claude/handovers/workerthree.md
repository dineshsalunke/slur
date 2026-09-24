Agent: workerthree · Lane: pickup SFX cut, #239 · Updated: 2026-09-24

## Goal

When several ingredients are taken back to back, a new pickup SFX stops the one still playing, then
plays. This applies to hosted rooms and /test-level. All other SFX stay as they are.

## Done

- #239 filed (labels: audio, bug).
- Plan and claims sent to slur-supervisor. Waiting for owner approval. Nothing is built.
- Previous lane (#233) is closed. See `git log -p -- .claude/handovers/workerthree.md` (814b6eb).

## State

- Hosted pickup SFX: `apps/client/app/audio/bind-room-audio.ts:22`, `playSfx( 'pickup' )` on a slot
  edge from none to a power. `audio-engine.ts` `play()` never stops an earlier source.
- `pickup.ogg` is 1.20 s (ffprobe).
- /test-level has no audio. Only `net-canvas.tsx` mounts `GameAudio`. The local pickup edge is
  `routes/test-level/local-combat.ts:128`.

## Uncommitted

- none

## Held files

- Claimed, pending clearance: `audio/audio-engine.ts`, `audio/audio-engine.test.ts` (new),
  `audio/sfx-map.ts`, `routes/test-level/local-combat.ts`, `routes/test-level/local-combat.test.ts`,
  `routes/test-level/route.tsx` (all under `apps/client/app/`).

## Next

1. Wait for the supervisor's clearance and the owner's answer to Q1.
2. Build as planned: `cut` in PlayOpts with an engine-level last-source-per-name and a 10 ms fade,
   `pickup: cut:true` in sfx-map, the /test-level edge plus a clientLoader that loads the pickup sample,
   and the vitest tests.
3. Live check with one Chrome per client and CDP logpoints on start/stop. Then commit and close #239.

## Open questions

- Q1 (owner): /test-level is silent today. Should the pickup SFX be added there (a, recommended), or
  should the fix be hosted-only (b)?

## Lessons → memory

- none
