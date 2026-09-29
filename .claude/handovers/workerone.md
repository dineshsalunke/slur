Agent: workerone · Lane: none (#364 done) · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Lane clear. Waiting for a new assignment.

## Done

- `254d267` #364 (CLOSED): Metal.baseColor + Hull.baseColor `#232324`, Environment.rotation 210,
  Environment.intensity 1. Tone mapping unchanged (Neutral 7, exposure 1). `CANVAS_GL.toneMapping` and
  the rear-view `uToneMode` start value now read `toneMode()`. Docs: ADR-031 bullet, ART_MATERIALS §7
  item 24 + review log 10 → 11, ADD §3 environment paragraph.

## State

- [measured] Headless Playwright on :5173. Home, lobby (`/game/<code>`) and `/test-level` all read
  scene.environmentRotation 210° and environmentIntensity 1. Hull material `#232324`@metalness 1 on
  home (first run only; the ship loads late) and `/test-level`. Rear-view uToneMode 7.
- [measured] No hull material in the lobby scene. [inferred] Ships are not drawn before GO.
- [unmeasured] The composer ToneMappingEffect mode. Its code path reads toneMode() each frame, and
  this lane did not change it.
- Track metal materials show colour `#ffffff`. The base colour is baked into the track texture
  (`track-texture.ts:828` reads `col('Metal.baseColor')`).
- Script: scratchpad `7b025e36…/look2.mjs`. No headless Chrome running.

## Uncommitted

- none.

## Held files

- none. Released all #364 claims.

## Next

1. Take the next lane from the supervisor.

## Open questions

- Owner: `#232324` gives F0 ≈ 0.017 at metalness 1, so the track now reads almost only the HDRI
  reflection. Luma was not re-measured.

## Lessons → memory

- none.
