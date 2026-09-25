Agent: workerone · Lane: #258 follow-up — scratched cast iron (round 3) + deck repeat · Updated: 2026-09-25 19:25

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Owner: *"i want a scratched cast iron sort of feeling"* and *"also the repeat on the deck is noticeable"*.
Scratches and blotches replace the round pits. The deck must not repeat every 4u. HOLD the commit and push until the owner OKs.

## Done

- 3b62bc4 arch leg v + groove bevel sign + #4a4d52, pushed (round 1).
- Round 3 (scratches + fBm blotches) built in the working tree. NOT committed. Captures sent earlier.
- Deck repeat fix built in the working tree. NOT committed. Captures sent to the supervisor at 19:25.

## State (measured unless marked)

- Cause of the repeat: the deck tile is 16 × 4u. The baked blotch fBm got round(4 × 0.3) = 1 noise cell in z, so
  smudges, mottle and scratches repeated every 4u.
- Fix: `deck-breakup.ts` patches the deck top material only (chained after `patchRailGlow`, cache key
  `slur-rail-glow-deck-breakup`). (1) The deck bakes no blotches (`SurfaceParams.bakedBlotches` false on the deck,
  true on graphite). The shader calculates the same bands from world-space value-noise fBm (no period) and applies
  `pow(1 - k·b, 2.2)` to the albedo (sRGB-equivalent) and `+ b·0.12` to the roughness G. (2) A per-plate hash picks
  1 of 4 tile columns × 4 mirrors. `textureGrad` uses the unshuffled uv derivatives. `mapN.xy *= deckFlip`.
- Mirror check: the groove is symmetric (`paintJointNormals`: equal bevel, ±wallTilt). A mirror plus a negated normal
  gives the same bevel lighting. The z-brush keeps its axis under the mirror [by construction]. Close-up capture: no
  seam at the plate edges and the grooves are continuous [observed].
- Draws: 102 before = 102 after on the long/far/deck poses.
- Gates: tsc pass · client vitest 51 files / 368 tests (new `deck-breakup.test.ts`, 3 tests) · comment ratchet clean
  · biome: only the old line-count warning on track-texture.ts.
- Captures: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/57f83fa0-3642-446b-95cc-c2869776a1b7/scratchpad/shots/`
  `{before,after}-{long,far,deck}.png`. Script `../deck-shoot.mjs <url> 9341 shots <label> "" <pose>`, which kills its
  own Chrome. The before shots came from a temporary revert, restored at once.
- Visible period after the fix: none that I can see. By construction the blotches are aperiodic and the plate detail
  is a random pick of 16 variants [not measured numerically].
- Ship scratches read faint at the ship pose [observed, not measured].

## Uncommitted

apps/client/app/dev/{tuning-schema.ts, tuning-panel.tsx} · apps/client/app/game/scene/{track-texture.ts,
track-texture.test.ts, track-floor.tsx, deck-breakup.ts (new), deck-breakup.test.ts (new)} · docs/ART_MATERIALS.md.

## Held files

The uncommitted list above.

## Next

1. Wait for the owner's OK on both round 3 and the deck repeat (through the supervisor).
2. Likely tunes: raise `Scratch.lift` / `Scratch.roughness` for the ship. If the plate variants still read as repeats,
   add the 90° rotation (the plates are square).
3. On OK: re-run the gates. Then `git commit -- <uncommitted paths>` with `feat(scene): scratched cast-iron graphite
   finish, deck breakup (#258)`, and put the NN-13 weighing in the body (5 options: world-space shader blotches ·
   per-plate shuffle · extra breakup layer · 16×16 tile · stochastic tiling; the last three rejected). Then
   `git push origin dev` and commit this handover.

## Open questions

- Owner: is the scratch density/strength right? Should the ship scratches be stronger? Is the deck repeat gone?

## Lessons → memory

none (the repeat cause is lane-specific; the fix is recorded in ART_MATERIALS.md)
