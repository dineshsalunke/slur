# Task 4 — Monoliths: isolation, then placement

**Status:** not started
**Depends on:** task 3 — the material must be judged under the agreed rig, not a lab-local one.

---

## 1. What this task delivers

Two stages, in order:

1. **Isolation** — the monolith forms and their material at `/iso-monolith`, judged alone until the stone
   convincingly reads as stone.
2. **Placement** — monoliths in the real scene, in **two roles** (see §3).

The isolation stage gates the placement stage. Do not place a material you have not accepted.

## 2. Spec

**Frozen silhouettes: Obelisk · Gate · Arch.** Not negotiable, not extendable.

**Sizes** (`HANDOVER.md` §3 — and `docs/ART_SCALE_REFERENCE.md` overrides if they disagree):
obelisk **200–400u** · gate **200–350u** · arch **150–300u**. Environmental scale must stay *clearly* distinct
from the 8u gameplay blocks — a monolith can never be mistaken for a hazard.

**Material** — dark stone / worn concrete family. Solid, heavy, **matte to subtle gloss**. Dielectric:
`metalness: 0`. Metalness with no environment map renders black.

**Surface** — clean large panel lines where needed · subtle-to-near-zero wear at gameplay distance · sparse
marigold seams only · *may be almost completely solid if that reads better*. `01_ART_DIRECTION.md`'s
minimalism rule bans dense greebling, noisy normal maps at gameplay distance, and many tiny emissive marks.
**A dense high-frequency normal map contradicts the direction** — the ask is large-scale relief.

**Role** — environmental anchors. They establish scale, frame the track, create rhythm, and communicate
intensity. They are **not** gameplay hazards and must never visually masquerade as deadly blocks.

**⚠ Constraint that bites placement:** `HANDOVER.md` §5 forbids *"dependence on monolith spacing for
steering."* Track-flanking monoliths may create rhythm, but they must not become the player's lateral
positioning cue — that job belongs to the track's interior panel cues.

## 3. Placement — the two roles (user directive, 2026-09-18)

| Role | Placement | Form |
|---|---|---|
| **Track-flanking** | Spaced along the track, both sides, regular rhythm | **Square** upright slabs |
| **Scene filler** | Randomly placed in the wider environment | Varied forms |

**This split is the owner's design call, not something the handoff states** — `02_ENVIRONMENT.md` freezes the
three silhouettes and the anchor role but says nothing about a two-role split. It is consistent with board 12,
whose track is flanked by plain rectangular slab towers in a regular rhythm while the wider field varies.

**Confirm at task start:** "square" should mean the **Obelisk** family (a plain upright rectangular slab), not
a fourth silhouette. Gate and Arch then belong to the filler role, where their openings can frame the sky.

## 4. References

`03_monoliths_final` — frozen silhouettes and materials. **One of only two scale-trustworthy boards.**
`12_approved_scene_marigold_depth` — how they read flanking the track, and how much seam energy is too much.
`13_original_mood_anchor` — looming scale, cold rim light, deep shadows.
`06_sector_concepts_final` — the Monolith Field sector: clean, sparse, monumental.

## 5. Definition of done

- Procedural geometry and material — no authored meshes, no bitmaps.
- **Reads as stone**, not as plastic or as a shaded box. This was the explicit failure of the earlier
  attempt; treat it as the primary acceptance criterion and judge it under the task-3 rig.
- Never confusable with an 8u gameplay block, at any distance, with bloom on or off.
- Large-scale relief only — no high-frequency normal noise at gameplay distance.
- Instanced. Draw-call and material cost stated.
- Placement creates rhythm without supplying a steering cue.

## 6. Known trap

Compute face winding from an **intended normal**, never "away from the centroid" — the latter silently
inverts faces on concave outlines (a notched section once rendered with zero marigold while every gate passed
green). Pin it with a normal-sign test.

## 7. Decision / As-built

*(filled in at review and after implementation)*
