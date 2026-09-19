# Task 5 — Asteroids: isolation, then placement

**Status:** not started
**Depends on:** task 3 (shared lighting rig) and task 4 — the two rock families must speak **one material
language**. Judge them under the same rig, side by side, before either is accepted.

---

## 1. What this task delivers

1. **Isolation** — the asteroid form family and its material at `/iso-asteroids`.
2. **Placement** — foreground / midground / background depth layers in the real scene, and the dense cold
   asteroid wall that fills board 12's upper frame.

## 2. Spec

**Frozen core forms: Angular · Plate · Broken.** Variations: **Elongated · Shattered · Cluster.**
**Holed asteroids are removed** — do not reintroduce them.

**Size classes** (`HANDOVER.md` §3): S **10–50u** · M **50–200u** · L **200–400u** · XL **400u+**.
Environmental scale stays clearly distinct from 8u gameplay hazards.

**Surface** — dark stone / desaturated rocky. Readable **large** fractures. **Rare** marigold energy veins:
an accent, not the default state — *most asteroids stay cold and dark.* Avoid noisy micro-detail;
**the silhouette matters more than the surface at speed.**

**Role** — organic contrast to the monoliths' hard geometry, and the supplier of foreground / midground /
background depth.

**Production** (`06_IMPLEMENTATION_NOTES_THREEJS.md`) — a small set of base forms, with variety derived from
scale, rotation, placement, cluster composition and selective fracture variation. Aggressive LOD or impostors
for distant fields.

**A→B→C** increases density, size, proximity and vein frequency. Asteroid Gauntlet uses **controlled/moderate**
density — the over-cluttered version was rejected. *Dangerous, not noisy.*

## 3. References

`04_asteroids_final` — frozen forms and accepted scale classes. **One of only two scale-trustworthy boards.**
`12_approved_scene_marigold_depth` — the dense cold asteroid wall filling the upper frame; note how little
vein energy there actually is.
`06_sector_concepts_final` — Asteroid Gauntlet density, and upper-frame filler for Planetary Horizon.

## 4. Definition of done

- Procedural mesh generation and procedural material — no authored rocks, no bitmaps.
- **Material matches the monoliths' language** (both dielectric, both large-scale relief, same review rig).
  Two rock families speaking different material dialects is a failure even if each looks good alone.
- Silhouettes read at speed, and **edge-on** — a plate seen edge-on must still be legible.
- Veins are visibly rare. If most instances glow, the accent has become the default.
- Never confusable with an 8u gameplay block.
- Instanced with LOD. Cost stated.

## 5. Known traps

- Compute winding from an **intended normal**, never from the centroid — see task 4 §6.
- Size procedural surface features in **world units**, not pixels: a 400u XL and a 10u S must not share an
  apparent feature scale.
- Base colour **multiplies** the map.

## 6. Decision / As-built

*(filled in at review and after implementation)*
