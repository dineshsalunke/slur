Agent: workerthree · Lane: env band → accent + picker A/D removal (no issue, owner ask) · Updated: 2026-09-29

## Goal
Band colour follows Accent.color, bandHeight 10, bandIntensity 2. Remove A/D from the lobby ship picker.

## Done
- d65ada3, 68d58ad (#368, CLOSED): final keyboard layout + ADR-032.
- d6cb3f6: Environment.bandColor dial removed; env-band.state reads Accent.color; bandHeight 6 → 10, bandIntensity 1.5 → 2.
- 28da8f8: ship-keys ←/→ only; overlays.test asserts D does nothing and → cycles; GDD §8 + ADR-032 item 5 amended.

## State
- Full client vitest 98 files / 665 tests pass; typecheck clean; lint 0 errors.
- Band look in a browser [unmeasured]. Stored band values fall back to the new defaults (tuning-persist.ts:23 from-check) [read, not run].

## Uncommitted
none

## Held files
none

## Next
1. Idle. Owner checks /test-level: the band is thicker (10) and brighter (2), and its hue follows Accent.color.

## Open questions
none

## Lessons → memory
none (supervisor is merging memory files; not written)
