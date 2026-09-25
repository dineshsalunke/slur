Agent: workerone · Lane: graphite material unification (#258) + Meteor.chance 0.15 · Updated: 2026-09-25

Older versions hold the plan stage, the monolith-regression diagnosis, #255 groove and /beat-deck
history (`git log -p -- .claude/handovers/workerone.md`).

## Goal

The owner's definition: one dark graphite pitted metal for every built surface. Only the deck keeps the
4×4u plate grid. Meteor.chance goes to 0.15. Built and pushed. Waiting for the owner's look.

## Done

- 37c9d79 (pushed to origin/dev): #3b3e42 base, a pit layer, the jointless graphite set on monoliths,
  blocks, debris, slab walls and rails, and 2 floor material groups. Ship hulls use box-projected pit
  maps. Pickup shells are graphite metal. Pit.* tunables added; Monolith.plate and Rail.plate removed.
  Meteor.chance 0.15. ART_MATERIALS §7 item 19 and the §2 rows.
- Issue #258 filed.

## State

- Gates: typecheck OK, lint 0 errors, client vitest 48 files / 349 tests pass (measured).
- Draw calls on /test-level: 92 per frame after (measured). The +1 from the floor groups is by
  construction; no before count was measured.
- Deck luma at spawn (fixed crop): keep 13.9, pre-#230 4.8, #4a4d52 17.2, before-base 18.9 (measured).
- Ship projection frame-time cost [unmeasured]. SwiftShader gives no GPU ms.
- Captures: scratchpad
  `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/d6ebc3ab-36ec-4063-9ee5-e104e67ccc37/scratchpad/after/`.

## Uncommitted

None.

## Held files

None. Claims released at the push.

## Next

The owner's feedback on a live monolith arch close-up arrived AFTER 37c9d79 was pushed. Fix all
four, then show a before/after of the same arch close-up (DPR 1, frozen, checked at 1:1). The causes
below are inferred from the code and not yet verified:

1. **Visible tiling:** one mottle blotch repeats about 6× at an even pitch across the top of the face.
   Inferred cause: the graphite tile is 16u, and `paintMottle` blobs repeat every 16u on a wide face.
   Fix: lower the mottle amplitude on the graphite set, and/or add a second octave at a non-integer
   scale or rotation, or give each face its own offset.
2. **The pits read as raindrops (stretched vertically, lit like beads, with tails):** check the V
   density that reaches monolith faces (`monolith-geometry.ts:86` divides by TEX_SPAN_X; graphite
   pxPerV = pxPerU). Check the normal sign on walls: CanvasTexture flipY, and the derivative tangent
   frame per face. The pit convention was matched only to the groove bevels, which are proven on the
   deck, not on walls. A pit must read as a dent: a shadow at the top and a lit lip at the bottom
   under a key light from above. The tails may be the brush lobes (below).
3. **Vertical streaking:** `paintBrush` / `paintNormalBrush` paint long along canvas y (1.5–6u). On
   walls v = y, so the strokes run up the face. Fix: paint the brush along x in the jointless set, or
   weaken it strongly.
4. **Inconsistent faces:** the left third of the pillar face is lighter and patterned; the inner arch
   faces (lintel underside, pillar inner sides) look untextured. Check the per-face UV offsets and
   the inner-face UVs in `monolith-geometry.ts`, and check that every face gets the graphite maps.

Supervisor's terms (2026-09-25): fix as a follow-up on dev under #258, with the same claims (still
cleared). Take the arch before/after only AFTER workertwo pushes the 96u width, because the arch
geometry moves with the width. For the "before" frame, hold the fix in the working tree or use the
owner's screenshot. Keep the Pit.density / Pit.tilt defaults quiet: the owner already reads the pits
as loud.

Then: the owner's colour verdict (#3b3e42 or #4a4d52) and pit loudness (Pit.tilt / Pit.density).
Files to re-claim from the supervisor: scene/track-texture.ts, scene/monolith-geometry.ts (+ its
test), maybe scene/track-texture.test.ts.

## Open questions

- Owner: #3b3e42 or #4a4d52?
- Owner: the pits catch the engine glow as bright specks. Keep, or lower Pit.tilt?

## Lessons → memory

`.claude/memory/tune-headless-captures-via-own-localstorage.md`
