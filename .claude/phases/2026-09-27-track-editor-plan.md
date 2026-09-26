# #304 — throwaway top-down track editor (owner-approved plan, 2026-09-27)

Plan by workertwo; owner said "go" with the supervisor's recommendations. Two workers build it.

## Owner decisions

- a) Saved tracks live in `tracks/` at the repo root (`tracks/<slug>.json`).
- b) No pickups on authored tracks in v1 (anchors `[]`).
- c) Pause the R3F scene (frameloop `'never'`) while the editor is open.
- d) Snap 1/2/4/8u. Length = the source track's length; no resize in v1.
- Scope v1: destructible block, solid block, gap, eraser. Power-ups later.
- Loop: fly `/test-level` → Edit → full-screen editor → draw/erase → Save → Play → repeat. Owner tests on
  `/test-level`.

## Architecture (verified by workertwo)

- Descriptor slot exists: `track-provider.ts` `TrackDescriptor = ProcgenDescriptor | { kind: 'authored'; levelId: string }`.
  `TrackDescriptorState` already syncs `levelId`. No wire or schema change.
- Builder exists: `groove-track.ts` `segmentOf(i, obstacles)` turns `{kind:'island'|'smash'|'hole', x0,x1,z0,z1}`
  into segments; `segmentsTrack()` wraps them. Authored provider = level JSON → obstacles → `segmentOf` → `segmentsTrack`.
- Shared registry: `registerAuthoredLevel(level)`; `resolveTrack` case `'authored'` → `authoredTrack(registry.get(levelId))`.
  `resolveTrack` stays sync: the loader registers before it opens the room. Hosted server: still throws in v1.
- Limits: `START_SAFE` (first 6 segments) ignores obstacles → editor shades it locked. `BLOCK_ID_STRIDE` = 64
  blocks per 20u segment → editor warns past that.

## File format (schema v1)

Units u. `x` ∈ [-48, 48], `z` from 0 to length·20. `x`,`z` = MIN corner. Entries sorted by z then x, one per line.

```
{ "version": 1, "id": "<slug>", "name": "…", "length": 420,
  "source": { "gen": "groove", "seed": 20260921 } | null, "savedAt": "ISO",
  "blocks": [ { "x": -12, "z": 300, "w": 8, "l": 4, "destructible": true } ],
  "gaps":   [ { "x": -48, "z": 900, "w": 96, "l": 12 } ] }
```

Shared `parseAuthoredLevel()` validates (bounds, w/l > 0). Biome: emit Biome-formatted JSON or ignore `tracks/`.

## Split

### workertwo — data + loading (S1, S2, parent-route half of S4)

- S1 shared: `packages/shared/src/sim/authored/{authored-level.ts, decompile.ts, authored.test.ts}`,
  `sim/track-provider.ts`, `src/index.ts`. **Commit the type + `parseAuthoredLevel` + `decompile` first, early,**
  and message workerone the SHA.
- S2: `apps/client/{tracks-plugin.ts, tracks-plugin.test.ts, vite.config.ts}` (dev-only, `apply:'serve'`,
  copy of the beat-deck-plugin pattern: `GET /__tracks`, `GET|POST /__tracks/<slug>`, path-escape guard),
  `tracks/` (new). Check: save a decompiled groove track by hand, open `/test-level?level=x`, fly it.
- Parent route: `routes/test-level/{route.tsx, test-level-room.ts, test-level-canvas/*}` — `?level=` +
  `&v=<hash8>` in the loader and `shouldRevalidate`, fetch-if-unregistered on cold load, `<Outlet/>` slot,
  frameloop `'never'` while `/test-level/edit` is active.

### workerone — editor UI (S3, edit-route half of S4)

- `app/routes.ts` (nested `edit` route under test-level), `routes/test-level/edit/route.tsx`
  (clientLoader seeds from the room's track via `decompile`; clientAction POSTs `/__tracks/<slug>`, registers,
  `redirect('/test-level?level=<slug>&v=<hash8>')`).
- `routes/test-level/track-editor/{track-editor.tsx, track-editor.state.ts, track-editor.utils.ts,
  track-editor.constants.ts, editor-map.tsx, editor-palette.tsx, editor-snap.tsx, editor-actions.tsx,
  use-editor-store.ts}`, `routes/test-level/edit-button/edit-button.tsx`, saved-track list in the sidebar.
- 2D `<canvas>` (not R3F): x across, z up (start at the bottom), wheel scrolls z, draw only the visible window,
  grid at snap size. Pointer handlers: click = one snap cell, drag = rect, eraser removes every rect it touches.
  Module state + `useSyncExternalStore` leaves; canvas context from a ref callback; no `useEffect`.
- Until workertwo's S1 commit lands, build against the schema above.

## Coordination

- workertwo → workerone: message once when S1 (format + decompile) is pushed, and once when the save endpoint
  and `?level=` loader are pushed.
- workerone → workertwo: only if the Save → Play hand-off needs a change in workertwo's files.
- Everything else goes through slur-supervisor. Never write the other worker's files.
- Mechanism weighing (CLAUDE.md #13) goes in the commit/PR body, not the source.
