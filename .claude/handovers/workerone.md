Agent: workerone · Lane: #258 — scratched cast iron + deck breakup + Wear + wall breakup · Updated: 2026-09-25 22:35

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Owner: scratched cast-iron graphite; no visible repeat on the deck or on the gates and monoliths; roughness +
metalness driven from the albedo value (Wear). HOLD all of #258 uncommitted and unpushed until the owner OKs it.

## Done

- 3b62bc4 arch leg v + groove bevel sign + #4a4d52, pushed (round 1).
- Round 3 (scratches + fBm blotches), deck repeat fix and Wear: in the working tree, not committed (details in
  the previous version of this file, 12abeec).
- **Gate/monolith repeat fix (owner GO 2026-09-25): built in the working tree, not committed.**
  - deck-breakup.ts: split out `BlotchWearUniforms`, `blotchWearUniforms()`, `updateBlotchWear()` and
    `BLOTCH_WEAR_GLSL` (hash, noise, `deckBlotch`, `blotchShade`, `blotchWear`). The deck uses them unchanged.
  - New wall-breakup.ts: `patchWallBreakup(material, uniforms)`. The vertex shader writes `vWallWorld`
    (instanceMatrix + modelMatrix, after project_vertex). The fragment shader picks the face plane from
    `cross(dFdx, dFdy)` and runs `deckBlotch` on that plane. It appends after map/roughness/metalness includes,
    with the same Wear as the deck: roughness −= roughness·w·span; metalness = clamp(m + metalness·w·slope,
    0, metalness). Idempotent through a WeakSet of its own wrappers. It re-wraps when a prior patch (rail
    glow) replaced onBeforeCompile.
  - track-texture.ts: `wallSurfaceParams()` = deck params with joints false (no baked blotches).
    `graphiteSurface()` now uses it. `graphiteSurfaceParams()` (baked) stays for the ship and the rail bodies.
  - Patched: monolith bodies (monolith-group), floor sides (track-floor, shares the deck uniforms), sealed and
    fractured blocks (track-blocks), debris (block-debris). Each updates its uniforms in its existing useFrame.
  - wall-breakup.test.ts (4 cases). ART_MATERIALS.md: new "Graphite walls do not repeat every 16u" bullet.

## State (measured unless marked)

- **Next 0 done (uncommitted): `Blotch.dark` 0.3 → 0.15** (tuning-schema.ts:102, ART_MATERIALS.md:1029). One dial drives deck + walls + baked ship/rail tile. Gates: typecheck pass · vitest 53/391 · lint 0 errors, comment ratchet clean. Taps `dark15-after-front-*` (AMBIENT=3) and `dark15-{front,owner}-*`: draws unchanged (112/109/111/109). Eyeballed vs amb-after-front-gate: leg, lintel and deck patches visibly fainter. The test fixture blotchDark 0.3 in track-texture.test.ts is an input, left as is. An owner localStorage override of Blotch.dark would still win [inferred].

- Hypothesis A (owner Deck.plate = 1) REJECTED. Owner screenshot: ~12.9 repeats across the 176u lintel face,
  ~3 down the 40u face → ~13.5u period. Plate 4 predicts 16u, plate 1 predicts 4u. "~40 glyphs" = ~3 baked
  blotches per tile × ~13 tiles.
- Gates after the wall fix: typecheck pass · client vitest 53 files / 391 tests · comment ratchet clean ·
  biome only the old line-count warning on track-texture.ts.
- No shader errors or exceptions in headless (console listener on).
- Draws AFTER: gate 107 · pillars 103 · lintel 100 · pillar-face 97 · owner-gate 111 · owner-pillars 109 ·
  front-gate 112 · front-pillar 109. No BEFORE draw counts for these poses. No mesh was added, so the count
  cannot change [inferred].
- Taps in `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/712f7c50-dc78-4945-ab8a-98e7c17e745e/scratchpad/shots/`:
  `before-*`, `before-lit-*`, `plate1-lit-*`, `after-*`, `after-lit-*`, `amb-after-*`, `ab-*` (before|after,
  brightened), `zoom-after-gate.png`. Script `../gate-shoot.mjs url port outDir label [storeJson] [posePrefix]`;
  `AMBIENT=3` adds an ambient + hemisphere light in the headless tab only.
- At default lighting our walls render near-black. Sky.environment 5 + keyLight 8 did not change that. The
  owner's shot is bright grey, so the owner's tuning or route differs [unmeasured]. There are no ambient-lit
  BEFORE taps, because the old code is not runnable without a second stack.
- Seen (eyeballed): amb-after-front-gate shows irregular patches on the legs, with no repeating glyph.

## Uncommitted

apps/client/app/dev/{tuning-schema.ts, tuning-panel.tsx} · apps/client/app/game/scene/{track-texture.ts,
track-texture.test.ts, track-floor.tsx, track-materials.ts, monolith-group.tsx, track-blocks.tsx, block-debris.tsx,
deck-breakup.ts (new), deck-breakup.test.ts (new), wall-breakup.ts (new), wall-breakup.test.ts (new)} ·
docs/ART_MATERIALS.md.

## Held files

The uncommitted list above.

## Next

0. Done (see State). HOLD.
1. Wait for the owner's verdict on the wall fix and the Wear captures. If the owner shares their lighting
   (the slur.tuning.v1 value or the knobs), re-shoot AFTER under it with gate-shoot.mjs.
2. On the owner's OK for all of #258: re-run the gates, then `git commit -- <uncommitted paths>` with
   `feat(scene): scratched cast-iron graphite, deck + wall breakup, albedo-driven wear (#258)`. The body gets
   the NN-13 weighing for the deck breakup (5 options: world-space shader blotches · per-plate shuffle · extra
   breakup layer · 16×16 tile · stochastic tiling; the last three rejected), plus the wall notes: no tile
   shuffle on walls, face-plane projection, and debris blotches that slide in flight. Then `git push origin dev`
   and commit this handover.

## Open questions

- Owner: what lighting is "lights up"? Our default render leaves the walls near-black.
- Owner: debris blotches slide while pieces fly (world-space). Is that acceptable, or should debris keep the
  baked tile?
- Owner: the rail bodies still bake blotches (16u repeat). Are they in scope?
- Owner: scratches read only in the highlight. Raise `Scratch.lift` / `Scratch.tilt`? Are the Wear ranges right?

## Lessons → memory

.claude/memory/webglrenderer-render-is-an-instance-method.md
