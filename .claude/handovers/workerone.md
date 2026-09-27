Agent: workerone · Lane: #322 pickup HUD (arc of slot glyphs + pickup flash) · Updated: 2026-09-27 (plan sent, awaiting owner)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#322: replace the corner power rack with a 3-glyph arc behind/below the ship (in 3D), a pickup flash that shrinks into its slot, and a tick on Q. Owner picked options 1 + 4.

## Done

- #318: 4b17a2e, fc85cd7. Closed.
- #320: b760826. Closed.
- #322: plan sent to slur-supervisor. No edits yet.

## State

- Plan: one InstancedMesh (3 slots + 1 flash) = +1 draw call. Glyph atlas is a CanvasTexture drawn with Path2D. The arc goes on three.js layer 2, and the rear camera renders layer 0 only, so the mirror does not show it.
- Rear view `rear-view-pass.tsx:36` is the only other `gl.render(scene)` (grep, this session).
- /test-level mounts `NetCanvas`, so the arc goes in `game/net-canvas.tsx` with no edit to routes/test-level (workertwo, #321).
- Chase camera defaults: back 14, height 4, FOV 70. Hull halfL 0.59 (bob) to 3.0 (split-crown), halfW 1.0–1.25.
- Glyph size readability (~50 px at 720p) is [unmeasured].

## Uncommitted

None of mine. Owner data in `tracks/` and workertwo's `run-sim.ts` are not mine.

## Held files

None until approval. Proposed claim: `game/scene/power-arc/*` (new), `game/net-canvas.tsx`, `game/input/power-select.ts`, `game/hud/power-rack/power-rack.tsx`, delete `game/hud/power-cell/*` + `game/hud/power-gem/*`, GDD HUD bullet.

## Next

1. Wait for the owner's approval via slur-supervisor.
2. Claim the files, build, run vitest + typecheck + lint.
3. Measure on /test-level (headless, DPR 1): draw calls, glyph px, mirror screenshot, bob vs split-crown.
4. Commit, push, `gh issue close 322` with the SHA.

## Open questions

- Owner: tick on Q only, or also on 1/2/3? Arc on remote ships? Touch buttons unchanged?
- From #320: is the exit-frame bloom too strong?
- #315, #308, `unionRects` order: still open from an earlier lane.

## Lessons → memory

none
