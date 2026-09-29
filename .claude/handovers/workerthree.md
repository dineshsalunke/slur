Agent: workerthree · Lane: #368 final keyboard layout (CLOSED) · Updated: 2026-09-29

## Goal
Replace the #358 Blur layout with the owner's final layout: ↑/↓ drive, ←/→ strafe, Space jump, E/D fire, S/F slot, X drop, B mirror.

## Done
- d65ada3 (#368): code, tests, home controls panel, HUD power hint, GDD §8.
- 68d58ad (#368): ADR-032 in docs/DECISIONS.md, supersedes the #358 layout.
- #368 closed with both SHAs.

## State
- Full client vitest: 98 files / 665 tests pass. That is 3 fewer than #367's 668, all from d65ada3, all intended: key-label modifier-label test, controls-panel Mac-swap test, and power-select's 4 old-key tests merged into 3.
- Typecheck clean. pnpm lint: 0 errors.
- Headless /test-level (:5173): ↑/↓/← drive; Q and A do nothing; F/S step the slot; ↑ and 3 do not; B toggles the mirror, V does not.
- E/D/X fire and drop with a full rack: unit tests only; not driven in a browser [unmeasured].

## Uncommitted
none

## Held files
none (docs/DECISIONS.md released)

## Next
1. Idle. Owner feel-tests the layout on /test-level.

## Open questions
- Owner: keep A/D in the lobby ship picker? (kept; supervisor's ruling, noted in GDD §8 + ADR-032)

## Lessons → memory
none
