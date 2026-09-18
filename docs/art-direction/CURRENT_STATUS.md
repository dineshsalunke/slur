# SLUR — Current art direction status

Reviewed 2026-09-18. Codex owns art design, visual review, and handoff work in this workspace. Claude owns implementation.

## Overall status

The scene/world direction is approved. Production assets and the integrated gameplay view still need visual validation. Ships and final HUD design remain open.

This review covers the v2 brief and reference boards, v1 engineering feedback, project art/scale documents, locally available ADR-010, and the four Claude lane handovers. It does not certify the current live render, performance, or remote PR state. Lane progress below is reported by those handovers, not a fresh playtest.

## Main reference and precedence

- [Latest approved integrated scene](boards/12_approved_scene_marigold_depth.png): overall colour, depth, lighting, materials, and composition.
- [Original mood anchor](boards/13_original_mood_anchor.png): cosmic scale, looming scenery, cold rim light, deep shadows, and warm energy.
- [Updated handover](handoff/HANDOVER.md): current written art decisions and corrections.
- [Reference index](boards/README.md): each board's purpose and limitations. Dedicated asset sheets retain authority over asset identity.
- Verified gameplay dimensions govern scale. Generated image proportions and printed annotations do not override them.

## Approved direction

**Cold Space. Warm Energy. Minimal forms. Readable gameplay.**

| Area | Approved design |
|---|---|
| Palette | Golden marigold `#F59A24`, hot amber `#FFB52E`, warm cores `#FFE0A0`; cold desaturated blue-grey, graphite, and deep-space backgrounds |
| Lighting | Cold rim light, deep shadows, localized bloom, controlled warm reflected spill; no foreground haze washing out hazards |
| Hierarchy | Ship, immediate threats, and pickups first; track and gaps next; scenery supports them |
| Track | Dark graphite, large clean panels, restrained gloss, marigold boundaries; subtle interior panel/contact cues |
| Gaps | Missing floor, thin marigold rim, slight inner-lip glow, dark open void |
| Standard blocks | Sealed mass with continuous silhouette and sparse seams |
| Destructible blocks | Broad fractures that interrupt outer contours; internal marigold energy; surface cracks alone are insufficient |
| Monoliths | Obelisk, Gate, Arch; immense dark stone/worn concrete forms; environmental anchors |
| Asteroids | Angular, Plate, Broken; Elongated, Shattered, Cluster variations; rare energy veins |
| Celestial forms | Gas giant, Moon, Crescent/Eclipse; cold and desaturated |
| Sectors | Monolith Field, Asteroid Gauntlet, Planetary Horizon, Distant Worlds, Eclipse Corridor, Convergence |
| A/B/C | Subtle, Balanced, Intense through density, scale, proximity, atmosphere, and selective energy; preserve gameplay contrast |
| Pickups | Physical 3D volume, dark shell, shaded sides, bevels, luminous core; distinct silhouettes |
| Weapon identities | Bolt tracer, Boost chevrons/thrust, Shield enclosure, radial Mine, elongated square four-fin Seeker |

Excluded from the approved art: slow blocks, special floors, holed asteroids, visible runtime lanes, vertical gameplay-block stacks, automatic safe-route glow, and a new red hazard colour code. Their absence from the art brief does not prove corresponding gameplay changes have shipped.

## Scale constraints carried by v2

Track width is 64u. Gameplay blocks stay 8u tall; width and depth vary. Gaps are 20u long with a reported minimum width of 4u. The Fighter reference footprint is 2.6 × 2.52u. The 7u clearance contract must be interpreted with the actual gap-traversal rules.

The Fighter is about 4% of track width **at equal depth**, not necessarily 4% of a screenshot. Ship proportions differ by class; Comet is wider than long. Do not apply the Freighter's elongated proportions to the full roster.

## Reported production progress

| Area | Evidence available | What remains |
|---|---|---|
| Review tools | Art lab/gallery and isolation lab appear in local git history | Use them for actual visual acceptance; tool completion is not asset approval |
| Track/backdrop | Claude reports floor gloss variation, marigold rails, warm spill, and framing work | Gap rim treatment still outstanding in the handover; review at race speed; floor repetition and bloom need attention |
| Asteroids | Rebuilt as fragment assemblies with stone surface and a lighting rig in isolation | Second material variant, edge-on readability, common lighting review, and track composition |
| Monoliths | Three families, stone/concrete materials, lighting controls built in isolation | Latest recorded user feedback: material still does not convincingly read as stone; placement and production preparation remain |
| Sky | Procedural nebula, crescent, depth layers, and environment lighting built in isolation | Compare in the composed scene; additional celestial families and A/B/C treatment incomplete |
| Gameplay blocks | Visual rule approved; joint readability test required | No passing sealed-versus-fractured recognition test found in reviewed evidence |
| Pickups/weapons | Family sheet approved; v2 adds volumetric treatment | No complete v2 family acceptance evidence found; test silhouettes in motion and Seeker in actual rear-view output |
| Finish and VFX | General language defined | Detailed production review and acceptance evidence still needed |
| Ships | Five gameplay footprints exist; current authored models remain implementation baseline | Final art designs and orthographic sheets are not frozen |
| HUD/UI | Minimal graphite/marigold direction | Typography, concrete layouts, motion, rear-view treatment, and final approval |

The four lane handovers describe local work not yet merged at the time they were written. Current local branch tips inspected: backdrop `ccf8707`, asteroids `9e96c43`, monoliths `99b4fe2`, sky `6940e8b`.

## Unresolved decisions and document conflicts

1. **Camera:** v2 proposes 4–5u with selective occlusion fade. ADR-010 adopts v2's art direction but explicitly defers this camera proposal. The track lane separately reports a 7u experiment. None is evidence of final gameplay approval.
2. **Breakable behaviour:** proposed ADR-009 includes ramming with a speed penalty. V2 says breakable does not mean safe to ram. Keep this visible for Claude and the user to resolve; art must not silently decide collision behaviour.
3. **Material consistency:** asteroid and monolith studies use different review lighting. Judge both under one agreed lighting setup before final material approval. Stronger texture alone cannot resolve every lighting problem.
4. **Reference fidelity:** the old boards were retained rather than corrected visually. Boards 07/09 still contain incorrect dimensions; board 10 still depicts disallowed height/stack examples. A corrected technical sheet remains useful future art work.
5. **Package metadata:** the extracted v2 `manifest.json` still names v1 and omits the two added image entries. Treat the v2 README, updated handover, and reference index as the package guide. Preserve the original archive contents.
6. **Checkout age:** this checkout is at `0ffea71`; locally cached `origin/dev` is at `57fd7d6`, which includes ADR-010 and an engineering copy of v2. Main-checkout v1 pointers therefore do not establish the latest project decision. No fetch, pull, or branch changes were made for this review.
7. **Package locations consolidated:** the two prior arrangements (this workspace's full v2 extraction, and the engineering copy with duplicate boards omitted) have been merged into one folder, `docs/art-direction/`, with all 14 boards in `boards/` and no duplication. Older notes referring to two locations predate this consolidation.

## Art review priorities

Follow the existing composition order: track → asteroids → monoliths → hero environment → sealed blocks → destructible blocks and joint readability review.

For the next review, establish one agreed camera/framing and lighting setup. Review the track's gap rims and surface restraint, then stone materials, then compose the approved ingredients. Compare against the main reference without copying incidental noise, incorrect dimensions, or every luminous seam.

Acceptance needs moving gameplay evidence: gaps distinct from seams, blocks distinguishable without labels, pickups recognizable from multiple angles, and the same reads across A/B/C with bloom on and off. Technical tests alone do not establish these results.

Ship design and HUD design can continue as separate art work. They do not block environment refinement.

## Evidence pointers

- [V2 status and scope](handoff/00_STATUS_AND_SCOPE.md)
- [V2 production checklist](handoff/07_ASSET_CHECKLIST.md) — original unchecked checklist, not a live progress tracker
- [Scale reference](../ART_SCALE_REFERENCE.md) — numerical reference; some interpretive prose is superseded by v2
- [Claude supervisor handover](../../.claude/phases/2026-09-18-art-lanes-supervisor.md)
- Individual lane handovers: `.claude/phases/2026-09-18-lane-<name>.md` in each sibling `slur-worktrees/<name>` checkout
- ADR-010, current ADD, and engineering provenance reviewed through `git show origin/dev:<path>` at `57fd7d6`
