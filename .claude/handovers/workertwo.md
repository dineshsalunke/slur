Agent: workertwo · Lane: in-race HUD Leave + mute restyle (#240) · Updated: 2026-09-24

## Goal

Restyle the in-race Leave and mute buttons to the new HUD style. The lobby ghost Leave must keep
working. Send before/after stills. DONE, awaiting owner review.

## Done

- Issue #240 filed.
- `aee81fb`: ghost style for in-race Leave + mute (`ui/ghost.ts`, `ui/speaker-glyph.tsx`), the
  click-focus fix (onMouseDown preventDefault), and mute hidden in PHASE.finished (supervisor add).
  `apps/client/DESIGN.md` gets an "In-race controls" entry.

## State

- At `aee81fb`: client tsc exit 0, biome clean on changed files, vitest 270/270, comment ratchet
  passes, `impeccable detect` reports none.
- Tested over CDP in a hosted room (scratch :2591/:5191, headless, DPR 1, muted): after a real mouse
  click on mute, activeElement is BODY; Space leaves aria-pressed unchanged; Tab focuses Leave.
- Stills (git-ignored) in `.claude/frame-tap-refs/`: `240-before-racing(-topright).png`,
  `240-after-racing(-topright,-topright-muted,-topright-focus).png`, `240-after-lobby.png` (ghost
  Leave unchanged), plus countdown shots.
- The results Leave keeps the old hud tone (out of scope). The results phase was not shot after the
  mute-hide edit [unmeasured; code-only change].
- `pnpm lint` repo-wide fails on untracked `.claude/skills/` files, not on mine.
- No scratch servers or Chrome running.

## Uncommitted

None.

## Held files

`game/overlays/{leave-button,audio-toggle,overlays}.tsx`, `ui/ghost.ts`, `ui/speaker-glyph.tsx`, and
the DESIGN.md "In-race controls" entry, until the owner signs off.

## Next

1. Wait for the owner's review of the stills. Apply any changes.
2. Follow-up (not claimed): the results panel Leave still uses HudButton (magenta). It fits
   workerfour's results strip work.

## Open questions

1. Older: R3 wear patches; worktree for the `036645c` stills; the 145 ms bake on the first race frame.

## Lessons → memory

none.
