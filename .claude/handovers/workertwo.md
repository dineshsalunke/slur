Agent: workertwo · Lane: fractured blocks (#214) · Updated: 2026-09-23, evening

## Goal

Ship ADR-009's breakable block as the fractured block kind: shoot it or smash through it, with art that
reads at race speed. Plan: `.claude/phases/2026-09-23-destructible-blocks-plan.md`.

## Done

- `523d63c` — shared sim + server: `Block.kind`, `placeBlock()`, smash-through (`smashKeep` 0.45, no stun),
  swept bolt-vs-block, `RunState.blockBroken`.
- `b6f1f45` — client prediction (`game/block-state.ts`, `restoreConfirmed()` before replay) and `/test-level`
  combat through shared `combat/combat-step.ts` (#217).
- `8c9afaf` — fractured-block geometry + shader, second instanced mesh in `track-blocks.tsx`, falling debris
  (`block-debris.tsx`, `block-breaks.ts`, `block-metal.ts`).
- `248096d` — side task: dev panel **Render → dpr** slider, live on `/test-level` and hosted rooms
  (`dev/render-scale.tsx` drives `setDpr` + `setSize`). NetCanvas now mounts the tuning panel.
- `215159e` — docs: ADR-015 (accepts ADR-009 with two amendments), ADR-009 status line, GDD §5.2 bullet and
  §5.7 row, INDEX entries.

## State

- `8c9afaf` did not cause the fps drop (workerone's verdict via supervisor).
- DPR slider: canvas buffer width 3200 → 800 → 2000 → 3200 for dpr 2 → 0.5 → 1.25 → 2 in headless Chrome at
  device ratio 2. Bloom lines up at 0.5. Software GL: 60 fps at 0.5, 24 fps at 2.
- Client tests 198/198 at `248096d`.
- The crack reads at about 20u to 50u in headless stills. Race-speed readability is `[unmeasured]`.
- Smash costs about 0.2s. `[unmeasured]` — calculated from `DEFAULT_TUNING`, never played. Bounce 1.45s was
  measured by workerone in #213.
- ADR-009 was edited in its Status line only. That follows the precedent at `DECISIONS.md` line 144, and the
  body is unchanged.

## Uncommitted

None.

## Held files

Lane files, idle until step 5 finds a problem: `apps/client/app/game/scene/track-blocks.tsx`,
`block-debris.tsx`, `block-breaks.ts`, `block-metal.ts`, `fractured-block-*.ts`,
`apps/client/app/game/block-state.ts`, `packages/shared/src/sim/fracture.ts`.
Not mine: workerthree's `combat-look.ts`, `pickup-field.tsx`, `projectile-field.tsx`,
`routes/test-level/local-{pickup,bolt}-field.tsx`, `bolt-*` scene files.

## Next

1. **Step 5 — owner's eye.** Owner plays `/test-level` at race speed: can sealed and fractured be told apart
   in about half a second? Then a hosted room: smash one, shoot one. Asked the owner directly on
   2026-09-23; waiting.
2. Write the verdict into ADR-015's "Readability gate" section. If it fails, the fallback is a support
   colour from `docs/ART_MATERIALS.md` (not red), or a stronger silhouette cut.
3. Then the lane can close: supervisor moves the summary to `.claude/phases/` and archives
   `HANDOVER-fractured-blocks.md`.

## Open questions

1. Owner: do sealed blocks stop a bolt? Built as yes — one line in `apps/server/src/rooms/run-room.ts`.
2. Owner: Freighter smashes cheap, or one `smashKeep` for all? Built as one value.
3. Owner: add a marigold ember burst on a break, or is the chunks' crack glow enough?
