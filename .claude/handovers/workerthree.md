Agent: workerthree · Lane: RFC-349 S18 render system (#384) + landing canvas fix (#386) · Updated: 2026-09-29 17:30

## Goal
One render system in the `render` phase owns `gl.render`; post effects come from a fixed slot list (RFC §5.3 P2).

## Done
- 04684954 (#386, CLOSED): landing `<Canvas>` children wrapped in `<Suspense fallback={null}>`. The canvas no longer dies about 2 s after load.
- ea385b6b (#384, CLOSED): `SceneEffects` = FrameSchedule with `render.post` (view: build/update/dispose composer by live tier) + `render.frame` (render: composer.render or gl.render). PlainRender + QualityGate(post) removed. Slots in `scene-effects.constants.ts` `POST_SLOTS`; descriptors in `post-effects.constants.ts`.
- Both commits are local only: `git push origin HEAD:dev` was denied by the permission classifier. The supervisor knows about #386; tell it about ea385b6b too.

## State
- A/B, same tree, headless Metal DPR 1, stepped clock: test-level 74 draws both, median 6.3 → 5.9 ms (3 runs each). Landing 45 draws both, 5.5–6.3 → 5.0 ms, bit-identical.
- Test-level pixel diff vs old: 1.1–1.2 % px > 2 levels; old-vs-old noise 0.6–1.2 %.
- One run showed rocks missing (67 draws). Four reruns were identical to old, so that run was transient [inferred cause].
- typecheck clean (except the known dev-gated `+types/route`), vitest 103 files / 702 tests, biome/ls-lint/comment/canvas-isolation clean.
- RFC §7 S18 row not marked landed (RFC not in my claim).
- No headless Chrome left running (checked `ps`).

## Uncommitted
none

## Held files
game/scene/scene-effects/*, world-scene.tsx, routes/home/landing-scene/landing-scene.tsx. Release them once the supervisor confirms.

## Next
1. Owner-approved follow-up to #386 (supervisor, 2026-09-29): "Landing: no blank gap before the 3D scene". File the issue linking #386 FIRST. Then send the supervisor a claim: landing-scene.tsx + a new reveal component (e.g. routes/home/landing-reveal/*) + possibly landing-backdrop.tsx.
2. Design: keep StillBackdrop visible until the first 3D frame paints. Key the reveal off the first rendered frame (a system inside the Canvas Suspense, after `render`), not setTimeout. Weigh ≥5 options in the commit body (NN-13).
3. Measure the gap in ms before and after (headless, DPR 1, muted, kill Chrome). Close the issue with the SHA after the push.

## Open questions
- Who pushes local commits, given that my push is denied?

## Lessons → memory
.claude/memory/suspense-escaping-a-canvas-kills-it.md (+ MEMORY.md index; composer hook updated)
Probe scripts are in this session's scratchpad (`probe.mjs`, `diff.mjs`). They are gone after the session; rebuild them from the memory above and [[gpu-timing-without-repo-edits]].
