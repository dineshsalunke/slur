Agent: workertwo · Lane: #304 track editor — data + loading (S1, S2, parent route of S4) · Updated: 2026-09-27

## Goal
Authored level format, dev save/load endpoint, and `/test-level?level=<slug>` so the editor's Save → Play loop works.

## Done
- 5165d46 — shared: `AuthoredLevel` v1, `parseAuthoredLevel`, `serializeAuthoredLevel` (Biome-stable), `decompileTrack`, registry, `resolveTrack` 'authored'.
- d382904 — `apps/client/tracks-plugin.ts` (+ test), vite.config, `tracks/groove-20260921.json`.
- 6982014 — `/test-level` loader `?level=` + `v`, `<EditButton/>` + `<Outlet/>`, `PauseWhileEditing` (frameloop).
- 12a91b7 — loopback sim frozen while `/test-level/edit` is open (`editorOpen` flag, separate from KeyP).

## State
- Round trip decompile → serialize → parse → build reproduces groove 20260921 / 7 and phrase 42 exactly (from START_SAFE).
- groove 20260921 decompiles to 48 blocks (16 destructible) + 7 gaps.
- Cold `/test-level?level=groove-20260921`: one fetch, finishZ 8000, ship flies.
- Draws/s 4320 playing, 0 on `/test-level/edit`; ship z 37.01 held 2.5 s in the editor, resumes after Back; same room.
- `&v=` change rebuilds the room without refetch.
- Editor UI Save → Play end to end [unmeasured by me — workerone's files].

## Uncommitted
none

## Held files
packages/shared/src/sim/authored/*, packages/shared/src/sim/track-provider.ts, packages/shared/src/index.ts,
apps/client/{tracks-plugin.ts, tracks-plugin.test.ts, vite.config.ts}, tracks/,
apps/client/app/routes/test-level/{route.tsx, test-level-room.ts, test-level-canvas/*}

## Next
1. Lane code-complete. Wait for the supervisor (owner check of the full loop on /test-level).
2. Do NOT close #304 — workerone closes it after the full loop passes (supervisor, 2026-09-27).

## Open questions
none

## Lessons → memory
none
