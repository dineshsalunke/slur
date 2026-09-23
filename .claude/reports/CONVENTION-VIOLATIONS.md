# Convention violations audit

Scope: `apps/client/app/**`, `apps/server/src/**`, `packages/shared/src/**`, plus `package.json` /
`pnpm-workspace.yaml`. Audited against `CLAUDE.md`, `.claude/rules/*.md`, `conventions/*.md`,
`CONTRIBUTING.md`. Read-and-report only — nothing here was fixed.

## Summary

| Severity | Count |
|---|---|
| Breaks a non-negotiable | 1 |
| Breaks a convention | 0 |
| Smell, arguable | 2 |

Everything else checked (fragment shorthand, one-component-per-file, `toneMapped={false}`, Python
tooling, `Math.random`/`Date.now` in the sim, positions-not-inputs, catalog version pins, CELL
misuse, canvas-isolation) came back clean. Details of what was checked and ruled out are in
"Checked, no violation found" at the bottom.

---

## Breaks a non-negotiable

### #14 — the no-comments rule

**Rule**, `CLAUDE.md` non-negotiable #14: *"No comments at all — except `setTimeout`, `setInterval`
and `useEffect`, one line each saying why it exists."* Also `.claude/rules/comments.md`: *"No
comments at all, except on `setTimeout`, `setInterval` and `useEffect` — one line each... Nothing
else gets one. No file headers, no section banners, no unit notes, no 'why' blocks, no `//` above a
function, no JSDoc."*

- **`apps/client/app/game/scene/sealed-block-shader.ts:137-138`**

  ```
  // Clamping to the INSET rectangle collapses each chamfer strip to a single perimeter value, so a seam
  // crossing a corner wraps it instead of stepping sideways by the bevel width.
  ```

  This sits above `function sealedPerimeterU(...)` inside a GLSL template-string body, not on
  `setTimeout`/`setInterval`/`useEffect`. It is exactly the "why" block the rule bans, and it's two
  lines where the rule allows at most one even on an exempted construct. `scripts/check-comment-ratio.mjs`
  only ratchets on files that change in a diff (`COMMENT_LINE` regex-counts `//`/`/*` lines
  regardless of whether they're inside a JS string), so this pre-existing pair survived every PR
  that didn't touch this file. **Fix:** delete both lines; the geometric reasoning belongs in a PR
  body, not the shader source.

No other non-exempt `//` comments, block comments, or JSDoc were found outside `.test.ts`/`.test.tsx`
files and the exempted `setTimeout`/`setInterval`/`useEffect` lines (all of which correctly carry
exactly one line each, e.g. `apps/client/app/net/attach-room-to-world.ts:127` on the `setInterval`,
and the `// JUSTIFIED EFFECT —` / `// GPU ... outlive React's tree —` lines on every `useEffect` in
`apps/client/app/game/scene/*` and `apps/client/app/audio/*`).

---

## Breaks a convention

None found in scope.

---

## Smell, arguable

### 1. A timer's lifetime is tied to a component mount via `useEffect`

**Rule**, `CLAUDE.md` non-negotiable #8: *"keep long-lived resources (sockets, subscriptions, the
Colyseus room, timers) OUTSIDE React on module singletons — never tied to a component's
mount/unmount."*

- **`apps/client/app/net/attach-room-to-world.ts:127-130`**, invoked from
  **`apps/client/app/game/net-canvas.tsx:51`**:
  `useEffect(() => attachRoomToWorld(room, world, predictor, trackRef), [room, predictor])`.
  Inside `attachRoomToWorld`, line 127-130:
  ```
  // Wall clock, not useFrame: sends must hold 30Hz when a backgrounded tab throttles rAF.
  const timer = setInterval( () => {
      const inputs = predictor.drainUnsent();
      if ( inputs.length > 0 ) room.send( INPUT_MESSAGE, { inputs } );
  }, INPUT_SEND_MS );
  ```
  literally a `setInterval` whose life is bounded by `NetCanvas`'s mount/unmount — the exact shape
  the rule calls out ("timers ... never tied to a component's mount/unmount").

  **Why it's arguable, not a clear violation:** the `Client`/`Room` object itself (`session.room`)
  is a module singleton (`apps/client/app/net/session.ts`), so this isn't the S2 bug (`room.leave()`
  in an unmount cleanup tearing down the connection on remount). What's scoped to the component here
  is only the ECS-attachment layer (ECS listeners + input-send loop), and it has to stop sending
  inputs and detach schema listeners when the race screen unmounts — leaving it running forever
  against a torn-down ECS world would be its own bug. The ECS `world` (`apps/client/app/game/ecs/world.ts`)
  is itself a module singleton, so the “subscription lifetime should match the resource it serves”
  case can be made either way.

  **What would settle it:** whether `NetCanvas` can ever remount while the same race continues (a
  route revalidation, a Suspense boundary retriggering). If it can't, this is fine as written; if it
  can, the timer should move to a module-level `attach`/`detach` pair keyed by room id instead of a
  `useEffect`-bound closure — the CLAUDE.md wording is not qualified by "unless the underlying
  singleton is itself is fine."

### 2. `CELL` referenced in client rendering code, not just the shared generator

**Rule**, `.claude/rules/track-space.md`: *"Space is continuous. `CELL = 4u` is an authoring snap
grid only — the design-time snap increment for all authoring, procgen and hand-authored alike... It
is not a runtime unit, not a movement snap, not a block-size rule."*

- **`apps/client/app/game/scene/track-rim.tsx:36,58,72`** and
  **`apps/client/app/game/scene/track-floor.tsx:24-25,77`** import `CELL` from `@slur/shared` and
  use it for geometry-authoring math (snapping rim segment probes, and a dev `console.warn` checking
  a floor span is "CELL-aligned").

  **Why it's arguable:** the rule's own wording says CELL applies "for all authoring, procgen and
  hand-authored alike" — this is rendering/authoring-adjacent geometry code (probing where a rim
  panel sits, validating an authored floor span), not the sim (`packages/shared/src/sim/step.ts`
  never imports `CELL`, confirmed clean). It reads as within the rule's own carve-out rather than a
  violation of it.

  **What would settle it:** whether the project considers client scene-geometry code "authoring" in
  the sense GDD §0 means, or whether the rule intends `CELL` to stay confined to
  `packages/shared/src/sim/*` generator files. Worth a one-line clarification in `track-space.md` if
  this comes up again.

---

## Checked, no violation found

- **Fragment shorthand (`<>`)** — `rg -n '<>'` across `apps/client/app/**/*.tsx` returns nothing.
  Every multi-child return uses `<Fragment>…</Fragment>` (e.g.
  `apps/client/app/game/scene/ship.tsx`, `apps/client/app/game/overlays/threat-hud.tsx`).
- **One component per file** — no `.tsx` file outside `routes/**` exports more than one
  capitalized component; `apps/client/app/root.tsx` has three exports but is the framework-mandated
  route module exemption.
- **Route module calling hooks while rendering `<Canvas>`** — `apps/client/app/routes/game/route.tsx`'s
  `Game` component calls zero hooks and delegates to `GameShell`; `scripts/check-canvas-isolation.mjs`
  covers this mechanically.
- **`toneMapped={false}`** — zero occurrences anywhere in `apps/client/app`.
- **Python in tooling** — no `.py` files outside the read-only `docs/art-direction/`, no
  `python`/`pip` references in any `package.json` or `scripts/`.
- **Positions synced instead of inputs** — `packages/shared/src/schema.ts` state (`x/y/z/vx/vy/vz`)
  is server-written output; the client only ever calls `room.send(INPUT_MESSAGE, …)`
  (`apps/client/app/net/attach-room-to-world.ts:130`) plus a handful of discrete command messages
  (`SET_CLASS_MESSAGE`, `USE_POWERUP_MESSAGE`, etc.) — no position message from client to server.
- **Track geometry synced tile-by-tile** — `TrackDescriptorState` in `packages/shared/src/schema.ts:53-60`
  carries only `kind/seed/tier/length/blockDensity/gapChance/levelId`; both `run-room.ts` and
  `net-canvas.tsx` call the one shared `resolveTrack`/materialization path.
- **Duplicated `simulate()`** — both `apps/server/src/rooms/run-room.ts:148` and
  `apps/client/app/net/prediction.ts:46` import and call the same `simulate` from `@slur/shared`.
- **`Math.random()`/`Date.now()`/`Math.sin()` in the deterministic sim** — none found in
  `packages/shared/src/sim/**`, `combat/**`, or `race/**`.
- **`@slur/shared` source-consumption** — `packages/shared/package.json` `exports` points at
  `./dist/index.js` / `./dist/index.d.ts`, not `src`.
- **Version pins hand-copied instead of catalog** — every dependency used by more than one package
  (`react`, `react-dom`, `three`, `@colyseus/schema`, `@colyseus/sdk`, `@types/node`, `tailwindcss`,
  `@tailwindcss/vite`, `postprocessing`, `@react-three/postprocessing`, `leva`, `typescript`) is
  `catalog:` in every `package.json`. Deps hand-pinned with a version (`@react-three/fiber`, `koota`,
  `react-router`, `vite`, `vitest`, `tsx`, `express`, `@colyseus/core`, `@colyseus/ws-transport`) are
  each used by exactly one package, which the catalog rule doesn't require.
- **`setInterval`/`setTimeout` polling live game state from outside a legitimate boundary** —
  the only non-test occurrence is the input-send loop in `attach-room-to-world.ts` (see Smell #1
  above) — it sends, it doesn't poll/sample state for rendering, and it's justified inline as a
  wall-clock requirement (rAF throttles in a backgrounded tab, `useFrame` wouldn't fire).
- **`useEffect` used where render/handlers/loaders would do** — every `useEffect` found in
  `apps/client/app` carries a one-line justification naming the external system (DOM keyboard,
  Colyseus schema callbacks, `import.meta.hot`, GPU resource disposal, R3F `addEffect` bracketing);
  none looked like a state-derivation or event-handler use case in disguise.
- **`setState` or allocation inside `useFrame`** — scanned every file importing `useFrame`
  (28 files); the only `set*` calls inside a `useFrame` body are `setEngineSpeed()` (a module-scope
  audio-engine setter in `apps/client/app/audio/game-audio.tsx:44`, not React state) and
  `state.setDpr()` (R3F's own store setter, gated behind a threshold check, in
  `apps/client/app/dev/render-scale.tsx:8`) — neither is a React re-render.
- **Subscription held high and prop-drilled** — the two `useQuery` call sites
  (`apps/client/app/game/scene/ship.tsx:7`, `apps/client/app/audio/remote-engine-audio.tsx:31`) and
  every `.listen(...)` call site (`apps/client/app/game/net/use-run-view.ts`,
  `apps/client/app/game/overlays/held-power-chip.tsx`) sit in leaf components that pass `entity`/`id`
  down, not the subscribed value itself, to children.
