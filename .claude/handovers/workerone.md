Agent: workerone · Lane: #258 — scratched cast iron + deck breakup + Wear (albedo-driven rough/metal) · Updated: 2026-09-25 19:35

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Owner: scratched cast-iron graphite; no visible deck repeat; roughness + metalness driven from the albedo value
(Wear). HOLD all of #258 uncommitted and unpushed until the owner OKs it.

## Done

- 3b62bc4 arch leg v + groove bevel sign + #4a4d52, pushed (round 1).
- Round 3 (scratches + fBm blotches) built in the working tree, not committed.
- Deck repeat fix built in the working tree, not committed (details in c52bba8).
- **Wear built (option a) in the working tree, not committed.** Captures + draws sent to slur-supervisor.
  - track-texture.ts: `applyWear(p, albedo, jointMask, packed)` (exported, pure). v = rgb sum ÷ base rgb sum;
    w = clamp((v−1)/valueSpan, ±1); G −= w·roughSpan·255·open; B = lerp(metalMin, metalMax, (w+1)/2) blended by
    open = 1 − jointMask. The joint mask is its own canvas (`paintJointMask`). `build()` paints the albedo once and
    shares it. New `fillJoints` helper replaces four copies of the joint-rect lambdas. `baseRgb` shared.
  - Removed: `Scratch.roughness` (schema, panel, params, `paintScratchRough`), `roughenBlotches`, `BLOTCH_ROUGH`,
    finish-patch metal lobes (`metalLobe`, `METAL_PATCH_MAX`, `grain.metalPatchMin`), `textureFor`.
  - deck-breakup.ts: MAP chunk computes `deckShade`, `deckWear`; ROUGHNESS `g − deckWear·uWearRoughSpan`;
    METALNESS `clamp(b + deckWear·uWearMetalSlope, 0, 1)`. Uniforms set per frame in `updateDeckBreakup`.
  - Schema/panel folder "Wear": valueSpan 0.3 (min 0.05) · roughSpan 0.25 · metalMin 0.7 · metalMax 1, rebuild.
  - Tests: 4 wear cases in track-texture.test.ts, 1 shader case in deck-breakup.test.ts.
  - docs/ART_MATERIALS.md: scratch bullet, new Wear bullet, blotch bullet, graphite grain, deck-breakup bullet.

## State (measured unless marked)

- Gates after Wear: tsc pass · client vitest 51 files / 373 tests · comment ratchet clean · biome only the old
  line-count warning on track-texture.ts (now 848 lines).
- Draws 102 on deck/far/ship/block, before and after Wear.
- Captures: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/57f83fa0-3642-446b-95cc-c2869776a1b7/scratchpad/shots/`
  `wear-{before,after}-{deck,far,ship,block}.png`. Script `../deck-shoot.mjs` (see git history of this file).
- Seen on the captures (eyeballed, not measured): scratches read weaker off the specular highlight on the deck and
  the block, because they are now smooth metal, not rough lines.
- The shader wear also reaches deck joint pixels (the shader cannot tell a joint) [inferred; small, joints are
  black at Groove.darkening 1].

## Uncommitted

apps/client/app/dev/{tuning-schema.ts, tuning-panel.tsx} · apps/client/app/game/scene/{track-texture.ts,
track-texture.test.ts, track-floor.tsx, deck-breakup.ts (new), deck-breakup.test.ts (new)} · docs/ART_MATERIALS.md.

## Held files

The uncommitted list above.

## Gate/monolith repeat (owner issue, 2026-09-25) — diagnosed, NOT built, no taps yet

- Screenshot: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/4baf1e00-ebb0-41b5-9dbb-ea63969ef3f6/images/10.png`.
- Verified: gate legs/lintel and pillars all render through `monolith-group.tsx:41` `graphiteSurface()` →
  `track-materials.ts:38` → `graphiteSurfaceParams()` (`bakedBlotches: true`). One 16 × 16u tile (1024 px,
  64 px/u), repeat = 16 / (Deck.plate × 4) (`track-texture.ts` build). UVs are world-scaled per face:
  `monolith-geometry.ts:83-86` u = along/16, v = sy/16, and `WALL_UV` (:131) rescales v by instance y ÷ span.
  ARCH lintel = 176 × 40u → 11 tiles across. PILLAR 12 × 50u (+ below) → 3–4 tiles down.
- Open: the supervisor counts ~40 glyphs across the lintel, which is a ~4u period, not 16u. Hypothesis A: the owner's
  `slur.tuning.v1` has Deck.plate = 1, which makes the graphite tile 4u, and the blotch field then has 1 cell per
  tile. Hypothesis B: a 4u feature inside the 16u tile. Check A first (read the owner's localStorage), then tap.
- Proposed fix: world-space shader blotches on graphite walls (reuse the deck-breakup noise). Graphite walls stop
  baking blotches; the ship keeps baked blotches. Shared blotch/wear GLSL is split out of deck-breakup.ts.
  Claims: track-texture.ts, deck-breakup.ts, track-materials.ts, monolith-group.tsx, track-blocks.tsx,
  track-floor.tsx (+ block-debris.tsx if the debris must match). Maybe new: wall-breakup.ts (+ test).

## Next

0. Gate/monolith: wait for the owner's go on the plan above. Check hypothesis A, take before taps of the gate and a
   pillar at owner-like lighting, build, then take the after taps.
1. Wait for the owner's verdict on the Wear captures. Tune if asked (Wear.* / Scratch.lift / Scratch.tilt), and
   re-shoot with the same script.
2. On the owner's OK for all of #258: re-run the gates, then `git commit -- <uncommitted paths>` with
   `feat(scene): scratched cast-iron graphite, deck breakup, albedo-driven wear (#258)`. The body gets the NN-13
   weighing for the deck breakup (5 options: world-space shader blotches · per-plate shuffle · extra breakup layer ·
   16×16 tile · stochastic tiling; the last three rejected). Then `git push origin dev` and commit this handover.

## Open questions

- Owner: scratches now read only in the highlight. Keep that, or raise `Scratch.lift` / `Scratch.tilt` so they read
  off-axis too? Are the Wear starting ranges right?

## Lessons → memory

none this seam
