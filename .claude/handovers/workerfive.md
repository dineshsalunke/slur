Agent: workerfive · Lane: style → Tailwind #284 · Updated: 2026-09-26 13:40

## Goal
`style` may set only CSS custom properties. Move the other 9 uses to Tailwind classes, tighten the
convention and add a lint check that fails the rest.

## Done
- 9d9779c — style(client): style sets only CSS custom properties; lint fails the rest (#284). Pushed.
  Issue #284 closed with the SHA.
- c3ab18d — workerone applied the same Canvas wrapper to `game/net-canvas.tsx` in its #273 commit.

## State
- `rg -n "style=\{" apps/client/app` → 2 uses, both custom properties: spec-tag `--fill`, standing-row `--order`.
- `biome-plugins/style-custom-properties-only.grit` (severity error) is wired in `biome.json`. A probe file
  with `style={ { background } }` fails `biome lint`.
- Player colours: `--color-player-0..11` in app.css; `game/colors.ts` exports `PLAYER_BG` / `playerBg`.
  `colors.test.ts` passes (3 tests). Overlay tests pass (31). Client typecheck clean. ls-lint,
  canvas-isolation and the comment ratchet pass.
- `pnpm lint` fails on dev because of `.claude/handovers/workertwo-move.mjs` (committed, not
  Biome-formatted). This is not from #284; the supervisor has been told.
- Computed styles after, headless DPR 1: 12 swatches = old hexes; roster dot #ff3b6b; stat bars 100% and
  15%; home and game Canvases 1600×813 fixed, landing z-index 0.
- Screenshots before and after: home, lobby, HUD, results, /test-level, /beat-deck (scratchpad, not
  committed). Identical apart from live scene motion and the live-runs list.
- Standing-row and winner-card dots [unmeasured] live: the solo results showed "No finishers".
- Headless Chrome killed (PIDs 30088, 48172).

## Uncommitted
- none

## Held files
- none (lane closed)

## Next
- Wait for the next lane from the supervisor.

## Open questions
- none

## Lessons → memory
- `.claude/memory/biome-stdin-skips-grit-plugins.md`
