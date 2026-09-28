Agent: workerthree · Lane: #355 Environment.intensity dial (plus the parked deck-albedo match, no issue) · Updated: 2026-09-28 23:50

## Goal
#355: find out why the Environment.intensity dial does nothing, then fix it (scene-environment.tsx; ask before any material file).
Parked: MEASURE + RECOMMEND the deck albedo against the golden crop (body + grooves; streaks come after #354).

## Done
- No source edits. Diagnosis only (see State).

## State
- The Environment.intensity dial WORKS on a fresh headless page. Mean frame luma at 0 / 1.2 / 5:
  high via setNum = 17 / 85 / 147 (before 3c576aa); low via the leva input = 18 / 92 / 135.
- CDP: `renderer.properties.get(m).uniforms.envMapIntensity` equals the scene dial on every MeshStandardMaterial.
  `scene.environment` is set. No material has its own `envMap`.
- After 668df76 (the high-black fix), the leva input on HIGH gives mean luma 19 / 112 / 180 at 0 / 1.2 / 5 (92-99% of pixels change). The dial works on both tiers.
- Dead dials: Deck/Rail/Rock/Ship.envMapIntensity. three 0.185.1 WebGLRenderer.js:2694 overwrites them with
  scene.environmentIntensity whenever material.envMap is null. Memory: scene-env-intensity-overrides-material.md.
- The owner's symptom is not reproduced. Candidates [unmeasured]: the owner turns a per-material dial, or the
  owner's view is black. Since 3c576aa (#354 part 1, 23:25:43) quality=high renders a black main view in
  headless (mean luma 0.4), with no console error. The supervisor routed this to workerone. workertwo sees it too.
- The default HDRI makes the deck near-white pale blue at defaults (v-base.png). Far from golden body sRGB 34.
- Albedo lane: the owner's crop is a Display P3 screenshot. Its best match is action-lighting.png: body neutral
  32, p50 34 over x0-1000 y1000-1510. cruise-lighting.png's deck is darker (body 23-25, slightly cool). The exact
  crop location was not found.
- Scratch: /private/tmp/claude-501/-Users-apple-Projects-personal-slur/4c4a9afb-6e2e-4fe8-a74a-af2ada955bb9/scratchpad
  (envprobe.mjs uniform dump, levaprobe2/3.mjs leva drive, st.mjs region stats, tap.mjs variant taps, diff.mjs).

## Uncommitted
none

## Held files
apps/client/app/game/scene/scene-environment.tsx (claimed for #355, no edits yet).

## Next
1. Owner decision on composition: (a) keep one global dial, delete the four dead per-material dials; or
   (b) set material.envMap explicitly and drive envMapIntensity = perMaterial × global. That touches workerone's
   material files. Then fix, verify on /test-level, and close #355 with the SHA.
2. Albedo sweep: tap.mjs variants (Metal.baseColor, Deck.roughness, Environment.intensity, ToneMapping.exposure)
   with st.mjs on the near-left deck region, against crop stats p10/50/90 = 26/35/47, body (34,33,33), groove (12,9,7).

## Open questions
- Owner: which /test-level quality tier, and which dial did they turn when #355 was seen?
- Owner: option (a) or (b) above?

## Lessons → memory
.claude/memory/scene-env-intensity-overrides-material.md
