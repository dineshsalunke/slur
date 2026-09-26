Agent: workertwo · Lane: component file layout (#283) · Updated: 2026-09-26

Older versions hold #272, #282, #266 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

Every client `.tsx` holds only its component. Module-level constants, helpers and state move to colocated
files in a `<name>/` folder. The convention is written down and a lint warns on violations.

## Done

- `2034287` B0: CLAUDE.md NN-9, `conventions/r3f.md` item 2 + useFrame snippet,
  `.claude/rules/react-house-style.md`, new `.claude/rules/component-files.md`, `.ls-lint.yml`
  (`.constants/.utils/.state.ts`), `biome.json` override, `biome-plugins/component-module-scope.grit` (warn).
- `fa42f18` B2+B3: routes/pacing (13 components + route.constants/utils), routes/home (5),
  routes/beat-deck (3).
- `f1ddda5` B6 (narrowed): game/hud power-cell, power-gem, power-rack, touch-button; game/net-debug-hud;
  dev/tuning-panel; routes/test-level `DEFAULT_GEN` → `route.constants.ts`.

## State

- The supervisor accepted these decisions for the owner (the owner may override): `.state.ts` for mutable
  module state; scratch THREE objects and shared geometries in `.constants.ts`; types stay in the `.tsx`;
  `lazy()` bindings allowed; `mount-overlays.tsx` excluded; `room-context` splits into `use-room.ts` plus a
  context file. No `index.ts`. No re-exports at old paths (supervisor, 2026-09-26).
- At `f1ddda5`: 0 plugin warnings in game/hud, game/net-debug-hud, dev. vitest 421/421 (57 files).
  Client typecheck clean. ls-lint and comment ratchet green.
- `game/net-debug-hud` has zero importers (dead code), as does `ui/tag.tsx`. Both left in place; relayed.

## Uncommitted

None of mine.

## Held files

None held now. Every future batch needs a fresh claim.

## Next

1. Deferred from B6 until #273 lands (workerone holds `game/net-canvas.tsx`, which imports these):
   `game/net-loop.tsx`, `audio/remote-engine-audio.tsx`, `audio/game-audio.tsx`, `net/room-context.tsx`
   (→ `room-context/room-context.tsx` + `.constants.ts` + `use-room.ts`; importers include net-hud,
   net-debug-hud, overlays.tsx, mount-overlays.tsx, routes/game/route.tsx, net-canvas).
2. Deferred from B6 until #284 lands (workerfive holds `routes/test-level/test-level-canvas.tsx`, the only
   importer): test-level-canvas, local-bolt/mine/pickup/seeker-field, local-loop. Skip local-combat.ts
   (workerthree, #280).
3. B1/B7: ui/, ship/ship-stepper, game/overlays, lobby/room-list. Wait for #284.
4. B4/B5: game/scene (48 files). Wait for the supervisor to sequence against #285. Fold in the
   `.claude/rules/r3f-rendering.md` line "Hoist scratch objects to module scope" → `<name>.constants.ts`.
5. After the last batch: raise the grit severity to error, push, close #283 with the SHAs.

Recipe for each batch:
- `node .claude/handovers/workertwo-move.mjs --dry <app-relative .tsx paths>`, then without `--dry`.
- Write the colocated files, Edit the prelude out of the `.tsx`.
- `biome lint --write --unsafe --only=correctness/noUnusedImports <dirs>`, then `biome check --write`.
- Typecheck, vitest, commit by pathspec (include the old deleted paths).
- Audit: `biome lint apps/client/app 2>&1 | grep " plugin "`.

## Open questions

- Owner: delete dead `ui/tag.tsx` and `game/net-debug-hud/`?
- Owner: confirm the layout decisions above.

## Lessons → memory

none
