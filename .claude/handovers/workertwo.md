Agent: workertwo · Lane: #304 track editor — data + loading (S1, S2, parent route of S4) · Updated: 2026-09-27

## Goal
Authored level format, dev save/load endpoint, and `/test-level?level=<slug>` so the editor's Save → Play loop works.

## Done
- 5165d46 — shared: `AuthoredLevel` v1, `parseAuthoredLevel`, `serializeAuthoredLevel` (Biome-stable), `decompileTrack`, registry, `resolveTrack` 'authored'.
- d382904 — `apps/client/tracks-plugin.ts` (+ test), vite.config, `tracks/groove-20260921.json`.
- 6982014 — `/test-level` loader `?level=` + `v`, `<EditButton/>` + `<Outlet/>`, `PauseWhileEditing`.

## State
- Round trip decompile → serialize → parse → build reproduces groove 20260921 / 7 and phrase 42 exactly (from START_SAFE).
- groove 20260921 decompiles to 48 blocks (16 destructible) + 7 gaps.
- Cold `/test-level?level=groove-20260921`: one fetch, finishZ 8000, ship flies (z 0→130 in 3 s W).
- Draws/s 4320 playing, 0 on `/test-level/edit`, same room after Back.
- `&v=` change rebuilds the room without refetch.
- Loopback sim keeps stepping while the editor is open (only the frameloop pauses).
- Editor UI Save → Play run end to end [unmeasured by me — workerone's files].

## Uncommitted
none

## Held files
packages/shared/src/sim/authored/*, packages/shared/src/sim/track-provider.ts, packages/shared/src/index.ts,
apps/client/{tracks-plugin.ts, tracks-plugin.test.ts, vite.config.ts}, tracks/,
apps/client/app/routes/test-level/{route.tsx, test-level-room.ts, test-level-canvas/*}

## Next
1. Wait for supervisor: owner check of the full loop on /test-level.
2. If the owner wants the sim frozen while editing, add it in PauseWhileEditing's sibling (test-level-canvas).
3. Close #304 once the owner signs off (whoever lands the last piece closes it).

## Open questions
- Freeze the loopback sim too while editing? (currently render only)

## Lessons → memory
none
