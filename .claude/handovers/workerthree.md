Agent: workerthree · Lane: #351 live marigold dial — DONE, issue closed · Updated: 2026-09-28 (seam at ~150k)

## Goal
#351: one dev-panel dial `Accent.color` drives every 3D marigold and Tailwind `--color-marigold`; Copy button.
Next lane: the parked #344 race-profile plan (awaiting supervisor go + a time window).

## Done
- 826340a: #351 shipped, pushed to dev, issue closed with the SHA (24 files).
- Memory `leva-onchange-fires-on-mount.md` (this seam's commit).

## State
- Mechanism: panel onChange → `setCol` + `syncAccent()` (anchor.set + version++) + `--color-marigold` on `<html>`.
  Shared-object holders are live; glyph atlas + meteor trail repaint on `accentVersion()` change.
- CDP users: `setCol('Accent.color', x)` alone does NOT propagate — also call `syncAccent()` from `game/scene/accent.ts`.
- typecheck, `pnpm lint` (9 pre-existing warnings), client vitest 640/640: green.
- Served CSS: utilities read `var(--color-marigold)` (verified via curl of `app.css?direct`).
- Live drag on /test-level: [unmeasured] — left to the owner.
- `Env.bandColor` does not follow the accent (supervisor: #352 deletes nebula-env-shell.ts).

## Uncommitted
none

## Held files
none — #351 claim released.

## Next
1. Tell slur-supervisor #351 is done (826340a) and the claim is released; #352 can take tuning-schema/tuning-panel.
2. Wait for the go on #344 race-profile plan.

## Open questions
- none

## Lessons → memory
.claude/memory/leva-onchange-fires-on-mount.md
