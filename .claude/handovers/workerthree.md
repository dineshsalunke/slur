Agent: workerthree · Lane: #394 black hole prototype (finish landmark) · Updated: 2026-10-01

## Goal
Port the vgpu black hole (option A) as a finish-line landmark with a cold tint, for the owner's look check on
`/test-level?blackhole=finish`. Owner round 1: make it bigger and move it to the right.

## Done
- Plan: 87dd59db. Prototype: 84be557c.
- `BlackHole.side` dial (schema): 6c7dfcab. Defaults minAngle 7→18, side 0→28: 1419038d.
- Placement uses the side bearing (`black-hole.utils.ts` `placeLandmark`), plus a test: f7d996d0.
- #394 comment with before/after numbers: issuecomment-5924260377.
- Tuning panel BlackHole folder (all 14 numbers + 3 colours): e5a6232e. Verified headless: side 28→−28 moves the hole right→left of the start pillar. #394 comment: issuecomment-5924381009.

## State
- side = degrees right of the track axis at a fixed bearing. The camera looks +z, so screen-right is world −x.
  The quad stays facing −z (parallel to the image plane, so it reads round). A billboard turn was tried and
  rejected: it projects as an ellipse and swings behind the camera at close range.
- After (1600×900, high, fov 70; quad diameter): start and mid 71.4 %W / 47.0 %H; finish−200 71.5 %W /
  223.5 %H. Before: 50 %W / 17.6 %H, and 223.5 %H at finish−200. The visible ring is about 1/3 of the quad.
- Frame cost at finish−6000, DPR 2, on−off: high −0.3, medium −0.2, low 0.0 ms (noise). +2 draw calls.
- Candidate radius 1500 was rejected: the 512² texture shows stair-steps at 385 %H near the finish.
- Cost: the mid-course canyon's right wall hides the hole. The start-line right pillar overlaps part of it.
- Screenshots: `.claude/frame-tap-refs/{before,after}-high-start.png`, `after-high-{mid,finish-200}.png`
  (git-ignored).
- Measuring driver: scratchpad `bh/measure.mjs` (onBeforeRender projection) + `bh/bhperf2.mjs` (DZ, STORE env).

## Uncommitted
none

## Held files
- apps/client/app/game/scene/black-hole/** (until the owner's look verdict)
- BlackHole lines in apps/client/app/dev/tuning-schema.ts (committed; release on verdict)
- BlackHole block in apps/client/app/dev/tuning-panel/tuning-panel.tsx (a future `lift` dial goes there too)

## Next
1. Wait for the owner's verdict via slur-supervisor. Tune only through `BlackHole.*` dials.
2. If the owner wants it clear of walls and pillars: add a vertical bearing dial (`BlackHole.lift`, degrees).
   The `height` dial is world units at true distance, so it barely moves the hole at the start line.
3. On approval: file a follow-up issue to move the landmark into `WorldScene` (hosted rooms), drop the
   param, and fix the rebake hitch.

## Open questions
- Owner: is the canyon occlusion at side 28 acceptable? Should the hole sit higher (needs a lift dial)?

## Lessons → memory
none
