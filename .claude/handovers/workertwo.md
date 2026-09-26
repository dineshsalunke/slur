Agent: workertwo · Lane: #285 Track via context (phase 1 done) + #283 component file layout · Updated: 2026-09-26 13:30

Older versions hold #272, #282, #266 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #285: the scene reads the Track through `useTrack()` (React context), never a prop.
- #283: every client `.tsx` holds only its component; module-level items live in colocated files.

## Done

- `2034287` #283 B0: rules, `.ls-lint.yml`, grit plugin (warn).
- `fa42f18` #283 B2+B3: routes/pacing, routes/home, routes/beat-deck.
- `f1ddda5` #283 B6 (narrowed): game/hud power-cell/gem/rack, touch-button; game/net-debug-hud;
  dev/tuning-panel; routes/test-level `DEFAULT_GEN`.
- `1015ffe` #285 phase 1: `game/track-context/{track-context.constants.ts, use-track.ts}`. WorldScene and
  LandingScene provide `<TrackContext value={ track }>`. 17 scene consumers + DeckLoop use `useTrack()`.
  Conventions r3f.md ("Context crosses the Canvas", "The Track comes from useTrack()") and
  react-router.md rule 6. NN-13 weighing posted on #285 (issuecomment-5844394610). Pushed.

## State

- R3F 9.7.0 bridges context into the Canvas: `useBridge()` → its-fine `useContextBridge()` [verified].
- At `1015ffe`: `/`, `/test-level`, `/beat-deck` and a hosted room render one canvas with no page errors
  [measured, headless against :5173]. Client typecheck exit 0. vitest 424 pass; 2 fail in
  `game/colors.test.ts`, which is untracked and belongs to another worker (not mine).
- WorldScene still takes a `track` prop (phase 1 bridge). net-canvas and test-level-canvas pass it.
- Supervisor: #273 landed at c3ab18d, so net-canvas, net-loop, audio and room-context are free of #273.
  #284 (workerfive, test-level-canvas) is still open.
- Dead code relayed to the owner: `ui/tag.tsx`, `game/net-debug-hud/`.

## Uncommitted

None of mine.

## Held files

None.

## Next

1. #283 deferred-from-B6, now unblocked by #273: send the supervisor a claim for `game/net-loop.tsx`,
   `audio/remote-engine-audio.tsx`, `audio/game-audio.tsx`, `net/room-context.tsx` (→ `room-context/`
   `room-context.tsx` + `.constants.ts` + `use-room.ts`). Importers: net-canvas, net-hud,
   net-debug-hud/net-debug-hud.tsx, overlays/overlays.tsx, overlays/mount-overlays.tsx,
   routes/game/route.tsx, game-audio. Check `rg -l "from '[^']*/<base>'"` again first.
2. #285 phase 2 (after #284): lift the provider to net-canvas and test-level-canvas so it wraps Canvas +
   HUD. Remove `track` from WorldScene, net-loop, pickup-field, net-hud, net-pilot-readout,
   flight-readout, net-debug-hud, local-loop, local-pickup-field, test-level-hud. attachRoomToWorld keeps
   its trackRef. Edit ORDER: provider first, consumers leaf-first, old prop last (memory below). Then close #285.
3. #283 test-level local-* fields + test-level-canvas (after #284). B1/B7 (after #284). B4/B5 game/scene.
4. After the last #283 batch: raise the grit severity to error, push, close #283 with the SHAs.

Recipes: `node .claude/handovers/workertwo-move.mjs --dry <paths>`, then Write the colocated files, Edit the
prelude out, `biome lint --write --unsafe --only=correctness/noUnusedImports`, `biome check --write`.
The shell may be fish: never pass paths through a `$VAR`; write them out. Render check: scratch
`render-check.mjs` / `host-check.mjs` (CDP, port 9347, headless, killed after); recreate if the
scratchpad is gone.

## Open questions

- Owner: delete dead `ui/tag.tsx` and `game/net-debug-hud/`?
- Owner: accept the context over `useRouteLoaderData` for #285 (supervisor relayed).

## Lessons → memory

`.claude/memory/live-hmr-sees-half-applied-edits.md`
