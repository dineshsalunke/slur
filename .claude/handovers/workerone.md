Agent: workerone · Lane: #258 — scratched cast iron + deck breakup + Wear (albedo-driven rough/metal) · Updated: 2026-09-25 19:55

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Owner: scratched cast-iron graphite; no visible deck repeat; and now roughness + metalness driven from the albedo
value mask (Wear). HOLD all of #258 uncommitted and unpushed until the owner OKs it.

## Done

- 3b62bc4 arch leg v + groove bevel sign + #4a4d52, pushed (round 1).
- Round 3 (scratches + fBm blotches) built in the working tree, not committed.
- Deck repeat fix built in the working tree, not committed (`deck-breakup.ts`: world-space shader blotches +
  per-plate 4 columns × 4 mirrors shuffle, textureGrad, `mapN.xy *= deckFlip`). Captures sent; details in c52bba8.
- Wear plan APPROVED by the owner (19:50), scratch option (a). NOT STARTED. Before captures taken (below).

## State (measured unless marked)

- Albedo = base #4a4d52 × one scalar f (`shade(c, f)`, track-texture.ts ~:180). Layers in `paintAlbedo`: plate
  jitter ±0.16 (deck) · mottle lobes (deck 34, ±0.26; graphite 90, ±0.08) · blotches (fBm; baked on graphite, shader
  on the deck) · scratch lift (additive, base × 0.35 × strength) · joints black (Groove.darkening 1).
- Packed map: R cavity (dead) · G roughness (base 0.8 + brush/finish/scuff/rub/scratch +0.18/blotch +0.12·b) ·
  B metalness (1; 0.85–1 in the rough finish patches; joints Groove.metalness). Material = Deck.metalness 1 × B,
  Deck.roughness 0.4 / 0.8 × G.
- Draws 102 on deck/far/ship/block, before Wear.
- Gates last run (deck breakup): tsc pass · client vitest 51 files / 368 tests · comment ratchet clean · biome only
  the old line-count warning on track-texture.ts.
- Captures dir: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/57f83fa0-3642-446b-95cc-c2869776a1b7/scratchpad/shots/`.
  `wear-before-{deck,far,ship,block}.png` = the current tree (the Wear "before"). Script `../deck-shoot.mjs`: run
  `node deck-shoot.mjs http://localhost:5173/test-level 9341 shots <label> "" <pose>` from the scratchpad, one pose
  per run; it prints draws and kills its own Chrome. No ImageMagick on this machine; send the separate files.

## Uncommitted

apps/client/app/dev/{tuning-schema.ts, tuning-panel.tsx} · apps/client/app/game/scene/{track-texture.ts,
track-texture.test.ts, track-floor.tsx, deck-breakup.ts (new), deck-breakup.test.ts (new)} · docs/ART_MATERIALS.md.

## Held files

The uncommitted list above. These are also the Wear claims (cleared by the supervisor; no new files).

## Next

1. **Build Wear (approved, option a):**
   - Tunables (tuning-schema.ts, `rebuild: true`) + panel folder "Wear" (tuning-panel.tsx, like the Blotch folder at
     ~:157): `Wear.valueSpan` 0.3 · `Wear.roughSpan` 0.25 · `Wear.metalMin` 0.7 · `Wear.metalMax` 1.
     Add them to `SurfaceParams`, `deckSurfaceParams()` and the test fixture.
   - Remove `Scratch.roughness` everywhere: schema, panel, SurfaceParams, `paintScratchRough` and its call in
     `paintRoughness`, and the fixture.
   - In `packedSurfaceCanvas`: also paint the albedo canvas (or reuse it). Per pixel, v = (r+g+b) / (base r+g+b);
     w = clamp((v − 1) / valueSpan, −1, 1). Leave joint pixels alone (their values come from Groove.*; detect them
     with a joint mask or paint the joints after). G −= w · roughSpan · 255. B = lerp(metalMin, metalMax, (w+1)/2).
     Drop `roughenBlotches` (the mask now covers the blotches) and the finish-patch metal lobes in `paintMetalness`.
     Keep the build per surface: build() already paints the albedo; share one canvas so it is not painted twice.
   - Deck shader (deck-breakup.ts): replace `deckB * BLOTCH_ROUGH` in the ROUGHNESS chunk with the Wear mapping of the
     blotch value (vB = 1 − k·deckB → wB → `- wB * uWearRoughSpan`) and add a metalness term in the METALNESS chunk
     (`metalnessFactor *= clamp(texel.b + wB * slope, 0, 1)`, slope = (metalMax − metalMin)/2). Add uniforms, set in
     `updateDeckBreakup` from `num('Wear.*')`.
   - Tests: a brighter pixel gets lower G and higher B than a darker one; joints unchanged; B stays within
     [metalMin, metalMax]. Update deck-breakup.test.ts if the chunk strings change.
   - Update docs/ART_MATERIALS.md (the blotch bullet ~:1018 and the deck-breakup bullet): the Wear mapping, the
     scratches now smooth and metallic, Scratch.roughness removed.
2. Gates: `pnpm exec tsc --noEmit -p apps/client`, client vitest, biome on the touched files,
   `node scripts/check-comment-ratio.mjs`.
3. Capture `wear-after-{deck,far,ship,block}` with the same script. Send them to slur-supervisor with draw counts
   (expect 102 = 102) and a pointer to the wear-before files.
4. On the owner's OK for all of #258: re-run the gates, then `git commit -- <uncommitted paths>` with
   `feat(scene): scratched cast-iron graphite, deck breakup, albedo-driven wear (#258)`. The body gets the NN-13
   weighing for the deck breakup (5 options: world-space shader blotches · per-plate shuffle · extra breakup layer ·
   16×16 tile · stochastic tiling; the last three rejected). Then `git push origin dev` and commit this handover.

## Open questions

- Owner: are the Wear starting ranges right (tune on the captures)? Are the ship scratches strong enough?

## Lessons → memory

none this seam
