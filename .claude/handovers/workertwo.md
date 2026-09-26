Agent: workertwo · Lane: #283 component file layout (B4/B5 left) · Updated: 2026-09-26 14:00

Older versions hold #285, #272, #282, #266 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #283: every client `.tsx` holds only its component; module-level items live in colocated files.

## Done

- `de756f3` workertwo-move.mjs Biome-formatted; `pnpm lint` passes on dev again.
- `7325f12` #285 phase 2: TrackContext at each canvas root (net, test-level, beat-deck; landing had it).
  Every consumer reads `useTrack()`; no `track` prop remains. #285 CLOSED.
- `6ad8055` #283: routes/test-level local-{bolt,mine,pickup,seeker}-field, local-loop, test-level-canvas.
- `492e8d2` #283 B1/B7: ui/{field-label,hud-button,hud-panel}, ship/ship-stepper,
  game/overlays/{lobby-ship-picker,race-again,roster,standing-row,start-control,threat-hud},
  lobby/room-list. `LABEL` now comes from `ui/field-label/field-label.constants`.
- Earlier: `2034287` B0, `fa42f18` B2+B3, `f1ddda5` B6, `e1c0882` net-loop/audio/room-context.

## State

- At `492e8d2`: typecheck 0, vitest 434/434, `pnpm lint` passes (warnings only) [measured].
- `/`, `/test-level`, `/beat-deck` and a hosted room lobby→GO render one canvas, HUD present, no page
  errors [measured, headless port 9347, Chrome killed by PID]. Two transient errors seen and gone on rerun:
  beat-deck shader VALIDATE_STATUS, home `useCallback is not defined` — a peer's HMR save [inferred].
- Plugin hits left in game/ outside held files: 35 files in game/scene (list below) [measured].

## Uncommitted

None of mine.

## Held files

None. B4/B5 claim not yet sent / cleared.

## Next

1. NEW ASSIGNMENT (supervisor, 14:00): B4/B5 is ON HOLD until workerfour's #277 S7 lands. Take #277's UI
   P2 items instead (useEffect-comment + UI items — list in `.claude/handovers/workerfour.md`, item 2 /
   review lane G). Read that list, send the claim to slur-supervisor, build only after "clear".
   workerfour keeps the scene P2s.
2. When released: B4/B5 game/scene, excluding held files (workerone: rear-view-*, pickup-field, attach-room-to-world,
   nebula-*, asteroid-*; workerfour: track-blocks, accent, track-materials, sealed-block-variation,
   monolith-field, debris-physics, gradient-dome/environment/env-config; workerfive may need camera and
   exhaust). Candidates: back-fill, block-burst, block-debris, bolt-pickups, bolt-streaks, boost-pickups,
   boost-streaks, deep-space-sky, engine-light, explosions, finish-gate, finish-outline, hit-spark,
   meteor-chunks, meteor-scorch, meteor-strikes, mine-bodies, mine-pickups, mine-shock, monolith-frames,
   monolith-group, near-fill, pickup-instances, projectile-field, rock-field, scene-effects, seeker-bodies,
   seeker-pickups, shield-dome, shield-pickups, ship-model, ship-shadow, track-floor, track-rail, track-rim.
   Split into 3–4 commits of ~10 files.
3. After the last batch: raise the grit severity to error, push, close #283 with the SHAs.

Recipes: `node .claude/handovers/workertwo-move.mjs --dry <paths relative to apps/client/app>` (then without
`--dry`), Write the colocated files, Edit the prelude out, then under `bash -c` (zsh does not word-split
`$P`): `biome lint --write --unsafe --only=correctness/noUnusedImports $P`, `biome check --write $P`.
ast-grep import rewrites drop the `;` — biome check --write restores it. Tests importing moved helpers
must be repointed by hand. Render check scripts: `render-check.mjs` / `host-check.mjs` (host-check presses GO)
in `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/701f1e36-c66c-4671-8b2a-3d8166793c3e/scratchpad/`.

## Open questions

- None open. B4/B5 released by the supervisor after #277 S7.

## Lessons → memory

none (zsh word-splitting already in `bash-tool-runs-fish.md`; ast-grep `;` in `ast-grep-drops-semicolons.md`)
