Agent: workerthree · Lane: #275 verification, then #286 audio-context fix · Updated: 2026-09-26 14:10

## Goal

Verify #275 live (done). Fix #286: /game could crash in the lobby when a remote ship's audio connected across two AudioContexts.

## Done

- #275 checks 1–4 measured, handover 5fcd446. Commented the toneMapped no-op on #275 (it is already closed).
- Filed #286, fixed it in 8facf36 (pushed), closed it with the SHA.

## State

- 8facf36: `app/audio/positional.ts` `ensureListener` calls `getContext()` before `new THREE.AudioListener()`.
- New `app/audio/positional.test.ts` (measured):
  - Before the fix: 3/3 fail, with 2 contexts constructed.
  - After the fix: 3/3 pass, and 17/17 in `app/audio`.
  - Biome, the comment ratchet and the client typecheck are clean.
- Covered by the test: the context stays 'suspended' until the first pointerdown, and a stored mute gives master gain 0 (supervisor's extra check).
- The live headless repro was not rerun after the fix [unmeasured]. The crash was intermittent, 1 in 3 loads.
- No Chrome or bot of mine is running. Port 9687 is released.

## Uncommitted

None.

## Held files

None. The #286 claim on positional.ts and positional.test.ts is released.

## Next

1. Take the next lane from the supervisor.

## Open questions

None.

## Lessons → memory

- `.claude/memory/stage-a-mine-on-test-level.md` (earlier this seam). No new memory: the #286 cause is recorded in the commit and the issue.
