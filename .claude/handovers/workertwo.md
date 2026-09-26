Agent: workertwo · Lane: component file layout (#283) · Updated: 2026-09-26 13:20

Older versions hold #272, #282, #266 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

Every client `.tsx` holds only its component. Module-level constants, helpers and state move to colocated
files in a `<name>/` folder. The convention is written down and a lint warns on violations.

## Done

- `2034287` B0: CLAUDE.md NN-9, `conventions/r3f.md` item 2 + useFrame snippet,
  `.claude/rules/react-house-style.md`, new `.claude/rules/component-files.md`, `.ls-lint.yml`
  (`.constants/.utils/.state.ts`), `biome.json` override, `biome-plugins/component-module-scope.grit` (warn).
- `fa42f18` B2+B3: routes/pacing (13 components + route.constants/utils), routes/home (5),
  routes/beat-deck (3). `home.tsx` and `game/route.tsx` import `NAME_KEY` from `call-sign-field.constants`.
  Pacing-strip `LEGEND` became the `PacingStripLegend` component.

## State

- The supervisor accepted these decisions for the owner (the owner may override): `.state.ts` for mutable
  module state; scratch THREE objects and shared geometries in `.constants.ts`; types stay in the `.tsx`;
  `lazy()` bindings allowed; `mount-overlays.tsx` excluded; `room-context` splits into `use-room.ts` plus a
  context file. No `index.ts`.
- At `fa42f18`: 0 plugin warnings in routes/pacing, routes/home and routes/beat-deck. vitest 421/421.
  Typecheck clean. ls-lint, canvas and comment checks green.
- Full `pnpm lint` exits 1 on 3 errors in other workers' uncommitted server files (run-room.ts,
  room-input.test.ts, run-room.test.ts). None of them is mine.
- ls-lint does not check a sub-extension name that has no rule of its own (`Bad.constants.ts` passed)
  until `.ls-lint.yml` lists it. `.test.ts` names have the same gap.
- `ui/tag.tsx` has zero importers (dead code). It is left in place; relayed to the owner.
- NOT PUSHED. B0 and B2+B3 are local commits on dev.

## Uncommitted

None of mine. `.claude/handovers/workertwo-move.mjs` and `workertwo-283-audit.txt` are committed with this
handover.

## Held files

None held now. Every future batch needs a fresh claim.

## Next

1. Push dev (`git push origin dev`) once the supervisor agrees.
2. B6: claim routes/test-level (7 files: local-*-field, local-loop, test-level-canvas, route.tsx),
   game/hud (power-cell, power-rack, touch-button; power-gem was held), game/net-loop, game/net-debug-hud,
   audio (remote-engine-audio, game-audio), dev/tuning-panel, net/room-context.
   The claim must list the importers too:
   `rg -l "from '[^']*/<base>'" apps/client/app`.
3. B1/B7: ui/, ship/ship-stepper, game/overlays, lobby/room-list. These wait until #284 lands (workerfive).
4. B4/B5: game/scene (48 files). These wait for the supervisor to sequence them against #285. Fold in the
   `.claude/rules/r3f-rendering.md` line "Hoist scratch objects to module scope", which should point at
   `<name>.constants.ts`.
5. After the last batch: raise the grit severity to error, push, and close #283 with the SHAs.

Recipe for each batch:
- Run `node .claude/handovers/workertwo-move.mjs --dry <app-relative .tsx paths>`, then run it without
  `--dry`. It `git mv`s each file into `<name>/<name>.tsx` and rewrites import specifiers with ast-grep.
- Print each file's prelude, Write the new files, and Edit the prelude out of the `.tsx`.
- Run `biome lint --write --unsafe --only=correctness/noUnusedImports <dirs>`, then `biome check --write`.
  The first leaves trailing commas that the second removes.
- Repoint anything that imported a constant from the old `.tsx`.
- Run typecheck and vitest, then commit by pathspec.
- Audit per file: `.claude/handovers/workertwo-283-audit.txt`, or
  `biome lint apps/client/app 2>&1 | grep " plugin "`.

## Open questions

- Owner: should dead `ui/tag.tsx` be deleted?
- Owner: confirm the six layout decisions above.

## Lessons → memory

`.claude/memory/ls-lint-skips-unlisted-sub-extensions.md`
