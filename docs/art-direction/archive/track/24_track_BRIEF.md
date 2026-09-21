# SLUR — Track art brief

**Status: finalized art direction, accepted by the user on 2026-09-19.** The user reviewed board 24 and requested its final artboard and brief. Approval covers the visual direction, not generated dimensions or incidental construction details. Codex owns this art handoff; Claude owns development.

## Deliverables and authority

**Approved placement reference:** panel **02 / FLUSH BORDER RAIL** in [the first flush-border revision](25_track_flush_border_rails_REVISION.png), explicitly accepted on 2026-09-20. Its top hero was rejected for appearing detached. [Hero revision 02](25_track_flush_border_rails_REVISION_02.png) is the latest correction and awaits user review. Panel approval is not whole-board approval.

**Rail attachment clarification — 2026-09-20:** the rail's inner side touches the deck's outer side continuously, with **zero air gap**. Rail top and deck top are **flush and coplanar**. Rail width is added outside the full 64u playable rectangle, like an attached border; its body extends below the common top plane. Do not float or raise the rail. Local warm light and reflection reach the immediately adjoining deck. This supersedes the earlier separated/elevated external-rail rendering and any statement below leaving top alignment open.

**Rail placement correction — user instruction, 2026-09-20:** both continuous marigold boundary rails sit outside the playable deck. The deck retains its full **64u playable width**, exclusive of the rails and their housings. Boards 24 and 25 incorrectly depict an inset emitter on the deck in their boundary closeups; that placement is rejected. Their approved material, lighting and wear remain valid. Rails convey the track's extent; they are not interior tile seams.

**Wear update — frozen 2026-09-19:** [Board 25](25_track_procedural_wear_FINAL.png) and its [procedural wear brief](25_track_procedural_wear_BRIEF.md) supersede this board's clean surface treatment. Follow the accepted visible wear strength; retain this brief's underlying material, geometry, boundary, gap and scale constraints.

- [Final track artboard](24_track_material_edge_FINAL.png): track overview and four detail studies.
- Accepted original artwork (superseded image removed): preserved unchanged; the final edition updates its status caption.
- [Golden reference 17](../golden-reference/17_golden_reference_FINAL.png): overall atmosphere, integrated visual hierarchy and compact borderless HUD remain authoritative.

Board 24 supersedes board 07 for deck finish, boundary treatment and interior seam language. It does not replace the finish-line concept, establish a new gap family or alter gameplay. Board 15's saturated surroundings and lifted material treatment remain rejected.

## Intended appearance

A broad, dark engineered ribbon suspended in space. The deck reads as satin bare graphite metal: deep charcoal body, restrained reflectivity, subtle finish variation and clean rectangular panel joints. Marigold sources stretch into broad, soft reflections across the deck. Faint desaturated slate-blue surroundings retain cold depth without tinting the surface bright blue or lifting the blacks.

The track supports the racing action. Ship, immediate threats and pickups must remain stronger focal signals in an integrated scene. Omission of those elements and the HUD on this board is for surface inspection only.

## Artboard panel brief

| Panel | Carry into the art | Do not copy literally |
|---|---|---|
| Overview | Broad dark ribbon; strong continuous outer edges; predominantly unlit joints; localized warm reflections; subdued cold cosmic depth | Generated tile count, perspective scale or insert alignments that suggest driving lanes |
| 01 — Satin graphite | Bare dark metal with broad soft highlights; narrow clean joints; restrained bevels and finish variation | Fine scratch density as mandatory gameplay detail; wet, chrome or mirror-like finish |
| 02 — Boundary | Continuous marigold border rail attached directly outside each side; top flush with deck; localized warm spill and reflection | Inset emitters, elevated rails and an air gap are incorrect. Rail width must not consume playable space; exact width and slab thickness remain unspecified |
| 03 — Seam inserts | Sparse short emissive segments of varied lengths and irregular spacing among mostly dark joints | Repeated lane-like cadence, full glowing grid or a highlighted safe route |
| 04 — Gap lip | Actual missing deck; thin warm lip; visible dark cut wall and open space underneath; stepped outline with attached floor tongue | Masonry-like wall texture and exaggerated depth; any implied collision change |

## Materials and light

**Deck and slab:** engineered metal. Keep the exposed cut section dark and visually consistent with the deck's construction; use broad clean metal faces rather than stacked stone blocks. Wear is subordinate to the panel form. Avoid rust, heavy scratches and ornamental greebling.

**Boundary rails:** continuous border members attached to the outside sides of the playable deck. Use marigold, with a small bright core and controlled halo, to convey the track's extent. Neither rail nor housing may occupy or reduce the 64u playable width. Rail inner side and slab outer side touch with zero air gap; their tops are coplanar. Bodies extend below the common top plane. Keep rails distinct from intermittent interior inserts. Local warm illumination and broad reflections affect the adjoining deck. Exact width and lower profile remain unspecified; top alignment is fixed.

**Interior:** most joints remain dark. Sparse emissive inserts may occupy selected seam portions; vary their lengths and spacing without communicating route guidance. Their permission supersedes the older blanket prohibition on emissive interior seams.

**Gap:** a thin luminous lip and slight inner-edge light reveal the absence of floor. A shadowed cut wall and visible space below supply depth. Never substitute a black floor patch, filled emissive cavity, warning brackets or a new hazard colour.

**Reflection, illumination and bloom:** preserve their separate visual roles. The source stays narrow; its deck reflection spreads broadly and softly; the halo stays localized. No global orange wash or bright blue ambient fill. Material settings in ART_MATERIALS.md are trial presets, not measurements extracted from this painting.

## Scale and construction constraints

Dimension order in this brief is **across-track width × down-track length × vertical height**, where applicable.

- Playable deck width is **64u, excluding both external rails**. A **4u** authoring ruler spans the deck in **16 equal intervals**, none reserved for rails. This does not impose collision quantization or certify the image's tile count.
- Cross-section order is **attached left border rail | full 64u playable deck | attached right border rail**. Rail width is additional to the deck width; there is no air separation. Rail tops are at deck-top height. Do not inset rails or narrow the deck to accommodate them. Rail collision behavior is not established by this art correction.
- Tile depth, joint width, bevel size, emitter width and slab thickness remain unapproved numerical choices. Preserve the visual relationships above rather than measuring the pixels.
- Recorded gap baseline is **20u down-track**, with a reported **4u minimum width**. Connected stepped openings and surviving floor tongues require engineering validation under current gameplay rules.
- A near-edge gap retains an intact supporting outer floor strip and a straight outer boundary.
- For future measured context sheets, gameplay blocks retain an **8u height envelope**. Recorded ship widths are **2u** for Executioner/Interceptor and **2.2u** for Comet, or **50–55%** of the 4u ruler. Do not enlarge a ship to fit this generated perspective.

Current verified gameplay dimensions override stale recorded values. This board supplies no new physics or collision requirements.

## Integrated review criteria

The accepted still establishes visual intent. The following checks remain for production art review, not completed test claims:

- At gameplay distance, the deck reads as dark satin metal and its broad reflections do not obscure hazards.
- Verify the full 64u playable deck remains clear of rail geometry and housing, with zero side gap and coplanar rail/deck tops. Approved panel 02 supplies the visual relationship; measured construction remains to be validated. Original boards 24/25 do not establish rail placement.
- Continuous boundaries remain distinguishable from sparse seam inserts; neither reads as a prescribed driving lane.
- Gaps remain distinguishable from dark joints through their lip, cut wall and open void, including in motion.
- Bloom does not merge the gap lip with adjacent inserts or wash out nearby silhouettes.
- Calm, balanced and intense environments retain the same deck identity and deep values. Environmental intensity does not require a brighter or bluer floor.
- Cruise and boost retain track readability; normal boost uses only subtle environmental motion blur.

## Remaining scope

Finish-line silhouette, deterministically measured plan/section sheets, exact slab thickness and moving gameplay validation remain separate work. The compact borderless HUD stays as approved in reference 17. No development changes accompany this handoff.

## Provenance

Artwork created with the built-in image-generation tool from golden reference 17. [Original prompt](24_track_material_edge_PROMPT.txt) and [final caption-edit prompt](24_track_material_edge_FINAL_PROMPT.txt) are retained. The original [proposal audit](history/24_track_material_edge_SPEC.md) records the visual limitations that this brief carries forward.
