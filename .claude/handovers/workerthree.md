Agent: workerthree · Lane: #368 final keyboard layout · Updated: 2026-09-29

## Goal
Replace the #358 Blur layout with the owner's final layout: ↑/↓ drive, ←/→ strafe, Space jump, E/D fire, S/F slot, X drop, B mirror.

## Done
- d65ada3 (#368): code, tests, home controls panel, HUD power hint, GDD §8. Pushed to origin/dev.

## State
- Client vitest app/game + app/routes/home: 73 files / 495 tests pass; typecheck clean; pnpm lint 0 errors (9 warnings, none mine).
- Headless /test-level (:5173): ↑ throttle 1, ↓ brake 1, ← strafe 1; Q and A do nothing; F→slot 1→2, S→1; ↑ and 3 do not change the slot; B toggles the mirror, V does not. Home panel reads "↑ Throttle ↓ Brake ← → Strafe Space Jump E Fire D Fire back S F Slot X Drop M Mute B Mirror".
- E/D/X fire and drop with a full rack: unit tests only; not driven in a browser [unmeasured].
- Ship picker A/D kept (supervisor ruled; lobby only).

## Uncommitted
none. ADR-032 draft is in my session scratchpad only (adr-032.md). It is restated in Next.

## Held files
- docs/DECISIONS.md: claimed. Waiting for the supervisor's "DECISIONS clear".

## Next
1. On "DECISIONS clear": append ADR-032 to docs/DECISIONS.md. It supersedes the #358 layout (GDD §8), is built in d65ada3, and covers: the one layout, the removed keys, no modifiers, no preventDefault (html/body overflow-hidden), gamepad/touch keep their buttons, the picker keeps A/D.
2. Commit, push, run `gh issue close 368` with the SHAs, and brief the owner on /test-level.

## Open questions
- Owner: keep A/D in the lobby ship picker? (kept for now)
- Supervisor: CLAUDE.md controls line still shows the old keys (supervisor edit).

## Lessons → memory
none
