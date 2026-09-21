# Track — material and edge study

> Historical study, not current guidance. Use the final subject README one directory above.

Status: **historical proposal audit; visual direction accepted by the user on 2026-09-19**. The user requested the final artboard and brief. [Final brief](../24_track_BRIEF.md) now governs this track handoff, with the limitations below retained. Art direction only; no development changes.

Visual authority: [approved golden reference 17](../../golden-reference/17_golden_reference_FINAL.png). This sheet isolates its track vocabulary rather than inheriting board 15's rejected saturation and material treatment.

## Review intent

Judge the deck as dark satin bare graphite metal: deep body values, broad restrained warm reflections, subtle surface variation and faint desaturated slate-blue surroundings. It must not become polished chrome, wet plastic, stone or concrete. Most joints remain dark. Continuous outer boundary emitters establish the ribbon; sparse interior inserts vary in length and spacing without implying lanes or a safe route.

The overview and four details cover surface finish, outer boundary, interior inserts and gap lip. The scene intentionally omits the HUD and gameplay assets to expose the track. The approved compact borderless HUD remains unchanged for integrated gameplay boards.

## Dimension contract and limits

- Track width: 64u. A 4u study ruler divides it into exactly 16 equal intervals across; this is an authoring reference, not collision quantization.
- Tile depth and slab thickness are not fixed by this proposal. Perspective imagery is not measured geometry.
- Recorded gap baseline: 20u down-track and minimum 4u width. Connected stepped cuts and attached floor tongues are visual intent requiring engineering validation.
- Preserve an intact supporting floor strip where a near-edge gap is shown; outer boundary remains straight.
- Future measured sheets must construct and check their rulers deterministically. No scale, tile count or dimension is certified by this generated image.

## Light and material distinctions

The emitter is the narrow bright source. Its reflection spreads across the satin metal at lower brightness. Bloom is a localized halo around the source, not a substitute for surface illumination. Gap lips are thin and reveal a shadowed metal section with open space below. They must not turn the cavity into a luminous filled shape.

The latest golden-reference decisions permit sparse irregular interior emissive inserts, superseding the older blanket non-emissive interior rule in ART_MATERIALS.md. Its shader values are trial presets, not acceptance measurements. The 4u study ruler likewise takes precedence over its older panel-division study range for this sheet.

## Visual audit of generated proposal

Board 24 (superseded image removed) preserves a deep graphite deck, muted cold surroundings, broad warm reflections and predominantly dark joints. The closeups isolate the requested surface and light behavior clearly.

Remaining visual defects: the gap's vertical walls acquire a masonry-like small-panel texture, which is not the intended metal section; their apparent depth is also exaggerated and must not establish slab thickness. Some interior inserts share longitudinal alignments, so distribution still needs review against the no-lanes rule. The closeup's fine surface scratches should not become required texture detail at gameplay distance. These details are not approved specifications.

## Approval checklist

- [ ] Deck reads as satin bare graphite rather than stone, chrome or wet coating.
- [ ] Deep shadows and faint desaturated slate-blue undertone match reference 17.
- [ ] Warm reflections remain broad and localized; most deck area stays dark.
- [ ] Boundary is continuous; interior inserts are sparse and irregular.
- [ ] Gaps read as missing geometry with slab section and open void.
- [ ] No driving lanes, safe-route lights, greebling or new floor types.

Still unresolved: exact slab thickness, panel depth, insert distribution at race speed, and gap-versus-seam recognition in motion. Finish-line silhouette and a measured track sheet remain separate follow-up studies; this board does not approve either. A/B/C environments must retain this material identity. User acceptance establishes the visual direction; unchecked criteria above are retained as production-validation tasks, not evidence of completed tests.

Generated with the built-in image-generation tool. Full generation prompt is saved alongside this specification.
