# Portal — finalized art direction

Owner approved the corrected portal board on 2026-09-27: “lets finalise this one for portals”. [Selected image](concept-board.png) is preserved byte-for-byte from the reviewed `concept-board-v2.png`, which corrects the exit panel to show the ship visibly emerging. The initial exit depiction is superseded.

Approved: paired graphite-ring pickup, ready and Place B glyphs distinguished by one versus two notches, upright segmented physical rim with localized marigold emission and a transparent interior, entry/exit treatment and placement/armed/cross/fade visual states. Owner specifies one lane / 4u; the board interprets this as the clear inner aperture, with the thin rim outside it. Embedded proposal labels remain unchanged; this approval record governs status.

Both ends are entries usable by any racer. A-enter / B-emerge illustrates one traversal, not permanently one-way gates. The armed-state paired miniature is a diagram, not a placement instruction. Gameplay preserves speed and height above the floor; jumping is not required to trigger a crossing. Incidental ship details do not replace approved fleet designs.

Integration note: at board creation the game configuration used `portalR: 3` and `portalH: 5` in `packages/shared/src/combat/portal.ts`. Reconcile collision reach and ship clearance with the owner's 4u width before integration. Generated “exact scale” text is not measured geometry. Precise ring height, rim dimensions, production assets and runtime validation remain implementation work, without reopening the approved visual direction. No game code changed.

Generated using built-in imagegen. Reproduction prompts: [initial board](prompts/initial.txt) and [exit correction](prompts/exit-correction.txt).
