Agent: workerone · Lane: #322 pickup HUD (arc of slot glyphs + pickup flash) · Updated: 2026-09-27 (lane done, closed)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#322: replace the corner power rack with a 3-glyph arc behind the ship (in 3D), a pickup flash that shrinks into its slot, and a tick on a selection change. Owner approved the plan with: tick on any selection change, local ship only, touch buttons unchanged.

## Done

- #318: 4b17a2e, fc85cd7. Closed.
- #320: b760826. Closed.
- #322: 7696144 (pushed). Issue closed with the SHA.
  - `game/scene/power-arc/*`: one InstancedMesh (3 slots + 1 flash), a ShaderMaterial and a Path2D glyph atlas (`glyph-atlas.ts`, 9 cells, one per HeldPower value). All updates run in `useFrame` through `power-arc.state.ts`. There is no React state.
  - `game/scene/net-power-arc.tsx`: a leaf that hides the arc while spectating. It is mounted in `net-canvas.tsx` under the ON_TRACK PhaseGate.
  - `power-select.ts`: `PowerActions.tick()` runs when Q or 1–3 changes the selection. net-canvas wires it to `playSfx('uiNav')`.
  - The corner rack keeps only the key hint. PowerCell and PowerGem are deleted.
  - GDD §5.3 "Slot HUD (#322)".

## State

- Draw calls on /test-level (headless, DPR 1, 1280×720): 124 with the arc, 123 with it hidden. That is +1.
- Mirror: no arc with layer 2. With the arc forced onto layer 0 the mirror still showed none, because the arc is below the rear camera's view cone. The layer is a guard.
- Glyph ≈ 40 px tall at 720p (screenshots).
- Selection sound: Q, Q, E played two 0.04 s starts (uiNav), measured via an AudioBufferSourceNode wrap.
- Arc distance back = max(halfL + 1.2, 3.4). Below 3.4 the arc covered bob's small hull (screenshot); at 3.4 it sits clear.
- 540 client tests pass, typecheck 0, lint 0 errors (the same 8 old warnings). These ran in the shared tree with workertwo's uncommitted files. No file of mine imports theirs.

## Uncommitted

None of mine. Owner data in `tracks/` and workertwo's #321 files are not mine.

## Held files

None. Lane finished.

## Next

1. Wait for the next lane from slur-supervisor.

## Open questions

- Owner: tune on /test-level if needed. `LOOK`, `GLYPH`, `PITCH`, `SAG`, `MIN_BACK` and `FLASH_*` are in `power-arc.constants.ts`.
- `--drop-shadow-power-gem` in `app.css` has no user now. It is not in my claim, so I did not remove it.
- From #320: is the exit-frame bloom too strong?
- #315, #308, `unionRects` order: still open from an earlier lane.

## Lessons → memory

none. Mirror result: a HUD object just behind and below the ship is outside the rear camera's view cone. This is lane-specific, so no memory was written.
