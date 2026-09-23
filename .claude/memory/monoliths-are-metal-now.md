---
name: monoliths-are-metal-now
description: "monoliths moved from stone (M3) onto the block metal texture (M2) — a real hazard/scenery readability tension, decided not discovered"
metadata: 
  node_type: memory
  type: project
  originSessionId: cf9e3784-ac83-49e1-adb2-9ca382e1dfc6
  modified: 2026-09-23T04:54:37.136Z
---

Monoliths (`apps/client/app/game/scene/monolith-group.tsx`) now render with the same photographic
metal maps (`Metal046B`, `useSealedBlockMaps`) as the deadly obstacle blocks, instead of a
procedural canvas panel texture. `docs/ART_MATERIALS.md` rev. 6 (2026-09-23) and `docs/ADD.md` §4
record this.

**Why:** the procedural monolith panel texture (`Monolith.plate = 17`) tiled unevenly and looked
bad. The fix reused the block texture set wholesale rather than fixing the procedural tiling.

**Why this isn't a routine texture swap.** `docs/ART_MATERIALS.md` §7 item 1 is an explicit
2026-09-19 owner decision: blocks are metal *specifically because* blocks "must read differently
from environmental monoliths," which were assigned M3 (dielectric stone, metalness 0.0). §4
criterion 2 makes that split a named readability gate (Monolith Field sector, cruise speed). Moving
monoliths onto the block's exact texture is the most direct move yet against that split — softened
only by the fact that monolith metalness/roughness had *already* drifted to match the blocks'
`graphite.ts` values since 2026-09-22, unreconciled, per several phase notes ("owner's call,
unmade").

**How to apply:** the owner reviewed this tradeoff and chose to accept the convergence (session
2026-09-23) rather than revert or leave it as an open question. If you touch monolith or block
material again: hazard/scenery separation for monoliths now rests on **scale and placement only**
(ADD §4 — huge, background-scale, never track-adjacent), not material. Don't casually diverge block
and monolith material again without checking whether that was intentional convergence or accidental
drift — read `ART_MATERIALS.md` §7 item 11 first. See also [[hazard-vs-scenery-material-gate]] once
that re-gate actually runs.

**Still open — not yet run:** §4 criterion 2 (hazard vs scenery unambiguous, judged in the Monolith
Field sector at cruise speed) was written against the old M3/M2 split and has never been re-gated
against the converged material. If a playtest fails that read, `ART_MATERIALS.md` §7 item 11 names
the fallback order: seam colour/count, coat finish, texture scale — before reaching for a second
image texture.
