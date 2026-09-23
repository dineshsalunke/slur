---
name: deck-material-on-blocks-and-monoliths
description: "blocks, monoliths and the finish-gate body all use the deck material; the old hazard/scenery material split is gone on purpose, and two readability gates are unrun"
metadata:
  node_type: memory
  type: project
  originSessionId: 4afb0d05-a56b-4b5a-a7f7-8e5ea56201cd
  modified: 2026-09-23T19:53:44.075Z
---

Since 2026-09-24 (#228, `81c2b76`, `9688d40`, `f6e9874`), sealed, fractured and debris blocks, the
monoliths and the finish-gate body all render with the deck material: `floorSurface()` /
`monolithSurface()` in `apps/client/app/game/scene/track-materials.ts`, finish from the `Deck.*` keys.
The `Metal046B` photographic maps and `Metal.mapTint` are deleted. `docs/ART_MATERIALS.md` rev. 8
(§7 item 16) and `docs/ADD.md` §4 record it.

**Why:** the owner's call — *"lets use the deck material on the blocks and monoliths please"*. It
finishes a convergence that rev. 6 (monoliths onto block metal) and rev. 7 (every metal at 1.0 / 0.25)
started. The owner chose no separate value dial for blocks, and no rail glow on blocks.

**How to apply:**
- Do not treat a block or monolith looking like the deck as a bug. It is the decision.
- Separation now rests on form, not material. A block differs from the deck by its seams, wear and
  bevels. A monolith differs from a hazard by scale and placement (ADD §4).
- Two gates are unrun: `ART_MATERIALS.md` §4 criterion 2 (hazard vs scenery, Monolith Field, cruise)
  and criterion 3 (*"A block is distinguishable from the deck it stands on"*). If one fails, §7
  item 11 names the fallback order: seam colour/count, finish, texture scale.
- `Monolith.plate` sets the monolith plate size. 0 = no plate joints. The painter needs
  `SurfaceParams.joints: false` for that, because `jointWidth: 0` still paints a 1 px groove.
