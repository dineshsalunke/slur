Agent: workertwo · Lane: #285 Track via context (phase 1 done) + #283 component file layout · Updated: 2026-09-26 13:40

Older versions hold #272, #282, #266 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #285: the scene reads the Track through `useTrack()` (React context), never a prop.
- #283: every client `.tsx` holds only its component; module-level items live in colocated files.

## Done

- `2034287` #283 B0: rules, `.ls-lint.yml`, grit plugin (warn).
- `fa42f18` #283 B2+B3: routes/pacing, routes/home, routes/beat-deck.
- `f1ddda5` #283 B6 (narrowed): game/hud power-cell/gem/rack, touch-button; game/net-debug-hud;
  dev/tuning-panel; routes/test-level `DEFAULT_GEN`.
- `1015ffe` #285 phase 1: `game/track-context/`. WorldScene and LandingScene provide `<TrackContext>`.
- `e1c0882` #283: `game/net-loop/`, `audio/game-audio/`, `audio/remote-engine-audio/`,
  `net/room-context/{room-context.tsx, room-context.constants.ts, use-room.ts}`. Six `useRoom` importers now
  import `net/room-context/use-room`. Pushed.

## State

- At `e1c0882`: `/`, `/test-level`, `/beat-deck` and a hosted room render one canvas with no page errors
  [measured, headless on port 9347 against :5173; Chrome killed by PID]. Client typecheck: only the 2 errors in
  untracked `game/colors.test.ts` (another worker's). vitest 424 pass, 2 fail in that same file. Comment
  ratchet and ls-lint pass.
- Owner approved deleting `ui/tag.tsx` and `game/net-debug-hud/` (via the supervisor). Both have zero
  importers [measured, rg]. My `git rm` was DENIED by this session's auto-mode permission check. Not done.
- WorldScene still takes a `track` prop (phase 1 bridge). #284 (workerfive, test-level-canvas) still open.

## Uncommitted

None of mine.

## Held files

None.

## Next

1. Deletion of `ui/tag.tsx` + `game/net-debug-hud/` (3 files): needs the owner to approve the `git rm` in
   the workertwo pane, or another agent whose permissions allow it.
2. #285 phase 2 (after #284): lift the provider to net-canvas and test-level-canvas so it wraps Canvas +
   HUD. Remove `track` from WorldScene, net-loop, pickup-field, net-hud, net-pilot-readout,
   flight-readout, local-loop, local-pickup-field, test-level-hud. attachRoomToWorld keeps
   its trackRef. Edit ORDER: provider first, consumers leaf-first, old prop last. Then close #285.
3. #283 test-level local-* fields + test-level-canvas (after #284). B1/B7 (after #284). B4/B5 game/scene.
4. After the last #283 batch: raise the grit severity to error, push, close #283 with the SHAs.

Recipes: `node .claude/handovers/workertwo-move.mjs --dry <paths relative to apps/client/app>`, then Write the
colocated files, Edit the prelude out, `biome lint --write --unsafe --only=correctness/noUnusedImports`,
`biome check --write`. The move script points importers at `<dir>/<name>`; a hook split out to `use-*.ts`
needs its importers repointed afterwards. Render check: `render-check.mjs` / `host-check.mjs` in
`/private/tmp/claude-501/-Users-apple-Projects-personal-slur/07388b20-843e-477a-8399-6debdc8905af/scratchpad/`
(CDP, port 9347, headless, kill by PID after).

## Open questions

- Owner: approve the dead-code `git rm` in this pane, or reassign it.
- Owner: accept the context over `useRouteLoaderData` for #285 (supervisor relayed).

## Lessons → memory

none
