# Track — frozen procedural wear direction

Status: **FROZEN — explicitly approved by the user on 2026-09-19: “this works, lets freeze this”.** [Final artboard](25_track_procedural_wear_FINAL.png) is an unchanged copy of the exact reviewed image. Its embedded “TRIAL” caption is historical; this approval record governs its status. Board 25 supersedes board 24 for surface wear; board 24 retains the underlying track, material and edge constraints. Keep track models and materials procedural and minimize hand-authored work. Art direction only; Claude owns implementation.

## Position

**Placement reference status:** panel 02 of [the flush-border revision](25_track_flush_border_rails_REVISION.png) is user-approved for rails; its hero is rejected for placement. [Latest hero correction](25_track_flush_border_rails_REVISION_02.png) awaits review. Frozen wear approval remains independent of these placement revisions.

**Latest rail attachment clarification — 2026-09-20:** external means added outside the playable width, not detached. Rails touch the slab sides with zero air gap and have tops flush with the deck. Localized warm spill reaches the adjoining floor. The separated/elevated rail revision is rejected for placement; approved wear is unchanged.

**Boundary correction — 2026-09-20:** both rails sit outside the full 64u playable deck. The board's inset boundary-emitter placement is incorrect and excluded from approval. Follow the [corrected track brief](24_track_BRIEF.md) for external rails; preserve this board's frozen wear. The instruction below to retain the existing model applies to wear itself, not to preserving erroneous rail placement.

The frozen target is a maintained but used track, at the wear strength and distribution shown in board 25. Wear interrupts warm reflections while preserving the graphite body and silhouette. Broad variation in the finish preserves the engineered surface and is to be expressed through repeatable rules rather than unique painted damage.

This develops the existing material brief's direction that variation comes from finish, roughness and large-scale form (ART_MATERIALS.md, material families), and board 24's instruction that wear stay subordinate to panel form. No particular shader API, performance cost or implementation has been verified by this art study.

## Three approved visual layers

| Layer | Appearance | Procedural design requirement for Claude |
|---|---|---|
| Finish wear — primary | Sparse, broad, softly bounded patches soften or interrupt warm reflections; some areas remain subtly smoother | Repeatable variation in surface roughness, with restrained contrast and large readable features; retain substantial untouched areas |
| Shallow scuffs — secondary | Occasional elongated rub clusters with varied lengths; weak down-track bias without continuous traffic paths | Rule-based distribution and orientation; no hand-positioned decals, tire tracks or unique scratch paintings required |
| Joint-edge rub — tertiary | Small intermittent worn portions near selected bevels or joint ends | Relate placement to panel edges, with sparse selection rather than a bright outline around every tile |

These are approved visual relationships, not a prescribed shader implementation. Wear is a material treatment; no mesh damage is requested. Keep the existing track model and collision shape intact.

## Controls worth exposing for art review

- Overall wear amount, including zero as the clean baseline.
- Broad patch coverage and characteristic size.
- Difference between dulled and smoother finish areas.
- Scuff density, length variation and directional bias.
- Sparse edge-rub amount.
- A stable variation seed so the same track section can be compared consistently.

No numeric ranges are approved. Claude should choose the implementation within the procedural pipeline and report any visible or performance trade-offs. Do not introduce required hand-authored texture maps, sculpted chips, baked damage atlases or individually placed decals for this look.

## Distribution and stability

Wear should belong to the track surface, stay stationary as the camera moves, and avoid identical stamps on adjacent tiles or obvious repeating bands. Keep variation irregular across the track width; a down-track bias must never become a highlighted route. Match the scale of broad wear across panels. This is a fixed visual treatment, not a request for live accumulated race damage or new gameplay state.

## Preserve

Deep dark satin bare graphite; faint desaturated slate-blue surroundings; localized marigold emission; broad warm reflections; predominantly dark joints; continuous boundaries; sparse irregular seam inserts; thin gap lips and open void. Wear must not generate new seams or apparent holes. HUD remains the approved compact borderless design when present.

## Exclude

Rust, flaking paint on bare metal, muddy grime, tyre/skid marks without a vehicle-contact rationale, bright silver scratches, dents, craters, broken floor, debris, all-over fine noise, lane-like wear bands and fully outlined tile edges. No stronger blue or brighter base values to make wear visible.

## Approval and production validation

[Frozen board](25_track_procedural_wear_FINAL.png): warm reflections are visibly interrupted and the boundary/gap light hierarchy survives. The user accepted the shown treatment, including its visible mottling. This supersedes the earlier assistant suggestion to reduce the pale patches or treat this image only as an upper bound. Match its overall wear character and strength without reproducing every individual generated mark. No procedural implementation has been tested.

Compare production results against board 25 with matched lighting and camera; board 24 is the clean baseline. Judge the overview first: wear should break reflections without competing with hazards, pickups or gap edges. Closeups explain the material but must not force tiny details into the gameplay render. Moving-camera checks for shimmering, repetition and surface stability remain future production validation.

The generated artboard establishes visual intent; it does not prove the surface was generated procedurally or that a chosen shader can match it. If a procedural approximation materially diverges from the frozen appearance, bring that difference to art review rather than silently changing the target or requiring hand-painted detail.

Generated using the built-in image-generation tool, with board 24 as the edit target. The companion prompt records the exact request. Finalization preserves the accepted image byte-for-byte, without regeneration. Track dimensions, slab-depth and gap-wall limitations from board 24 remain in force. No development changes accompany this freeze.
