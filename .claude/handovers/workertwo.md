Agent: workertwo · Lane: #283 B4/B5 game/scene (released, not started) · Updated: 2026-09-26 14:40

Older versions hold #285, #272, #282, #266 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #283: every client `.tsx` holds only its component; module-level items live in colocated files.
  Last part: B4/B5 in game/scene.

## Done

- #277 look check (read-only, HEAD on :5173, no old-commit A/B run by owner rule): all PASS.
  Pickups seeker/mine/shield/bolt/boost, hit spark and explosion match spec. The code diffs of bb433b0,
  47cce3e and 5505ed8 read as equivalent. Reported to the supervisor.
- `b06bd73` #277 P2-4 PhaseGate (Overlays/NetHud 2→0 renders), P2-5 test. `fc008d0` #277 P2-2 comments.
- Earlier: `492e8d2` #283 B1/B7, `6ad8055`, `2034287` B0, `fa42f18` B2+B3, `f1ddda5` B6; `7325f12` #285.

## State

- Look-check images: scratchpad `1e4684a0-…/scratchpad/look/*.png`. Drivers are `look-tap.mjs` (pickups)
  and `vfx-tap.mjs` (VFX) [measured].
- Under `setFrameloop('never')`, `Page.captureScreenshot` returns black. Read the canvas with
  `toDataURL` in the same task as `advance()` [measured] — memory
  `.claude/memory/frameloop-never-screenshots-black.md`.
- No Chrome of mine is running. Every Chrome I started was killed by PID [measured].

## Uncommitted

None of mine.

## Held files

None. The B4/B5 claim is not sent yet.

## Next

1. Send the B4/B5 claim to slur-supervisor. Candidates are the game/scene files with plugin hits, from
   `pnpm lint` warnings. P2-8 files (debris-ground, block-debris, meteor-chunks, meteor-strikes) are FREE
   since 50c6e17. EXCLUDE the boost-plan files (scene-effects.tsx, camera/chase.ts). Also exclude
   workerone's (rear-view-*, pickup-field, attach-room-to-world, nebula-*, asteroid-*). `ship.tsx` is now
   `ships.tsx` (acdffa9). `track-rails.state.ts` already fits the pattern.
2. Build after "clear", in 3–4 commits of ~10 files. Recipe: `node .claude/handovers/workertwo-move.mjs --dry
   <paths rel. to apps/client/app>`, then without `--dry`. Write the colocated files and Edit the prelude out.
   Then, under `bash -c`: `biome lint --write --unsafe --only=correctness/noUnusedImports $P`,
   `biome check --write $P`. Repoint tests by hand.
3. After the last batch: raise the grit severity to error, push, and close #283 with the SHAs.

## Open questions

- None.

## Lessons → memory

- `.claude/memory/frameloop-never-screenshots-black.md` (new this seam).
