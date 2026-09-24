Agent: workertwo · Lane: in-race HUD Leave + mute restyle (#240) · Updated: 2026-09-24

## Goal

Restyle the in-race Leave and mute buttons (top-right, countdown/racing) to the new HUD style
(`game/hud/*`, `apps/client/DESIGN.md`). The lobby ghost Leave must keep working. Send before/after stills.

## Done

- Issue #240 filed.
- Plan + claims sent to slur-supervisor. Waiting for the owner to clear it. Nothing built.

## State

- Leave (hud tone) = `HudButton variant="leave"`: magenta border, `rounded-[5px]`. AudioToggle = emoji,
  `rounded-[5px]`, `backdrop-blur`, cyan `shadow-hud`. Both break DESIGN.md Don'ts (read this session).
- Plan: both use the lobby ghost treatment (square, 36px, Readout/25 on Deep/60). Mute gets an inline SVG
  speaker glyph like `ui/chevron.tsx`. The shared classes go in `ui/ghost.ts`.
- `game/input/keyboard.ts` never preventDefaults Space. A clicked button keeps focus, so a jump presses
  it again [inferred, not reproduced]. Offered to the owner as an optional fix.

## Uncommitted

None.

## Held files

Claimed, not yet cleared: `game/overlays/{leave-button,audio-toggle,overlays}.tsx`, new
`ui/ghost.ts`, new `ui/speaker-glyph.tsx`, `apps/client/DESIGN.md`.

## Next

1. Wait for the supervisor or owner to clear the plan and answer the Space-focus question.
2. Take the BEFORE still first: scratch stack on its own ports, headless Chrome (DPR 1, muted), hosted
   room, countdown, top-right crop. Also one lobby still.
3. Build → tsc/lint/vitest → run `impeccable detect --json` → AFTER stills → commit → handover.

## Open questions

1. Owner: include the Space-focus fix (onMouseDown preventDefault) in #240?
2. Older: R3 wear patches; worktree for the `036645c` stills; the 145 ms bake on the first race frame.

## Lessons → memory

none.
