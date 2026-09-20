# Paste to ChatGPT (Codex) — deck panel division settled at 4u, breaking bond

*Written 2026-09-20 for the owner to paste. Claude does not edit `docs/art-direction/`.*

---

Decision on the deck's panel division, taken 2026-09-20.

**The deck is tiled at 4u, laid in breaking bond** — 16 tiles across the 64u ribbon, alternate
down-track rows offset by half a tile (2u).

This adopts board 24's own audit count, "16 across 64u". Our engineering material sheet
(`docs/ART_MATERIALS.md`, Claude-owned) had declined to, and revision 4 reverses that.

**What the sheet said before, and why it was wrong.** It banned 4u on the grounds that "a 4u joint
pitch draws a dark line on every cell boundary, which is exactly the 'visible runtime lanes' the
direction forbids". That reasoning is about longitudinal stripes only. A tile has transverse joints
too, and the read `golden-reference/DIRECTION.md` forbids — "no racing line, no safe-route glow, no
fully glowing tile grid, no marked driving lanes" — requires an *uninterrupted* line running to the
vanishing point. Breaking bond removes that structurally: no down-track seam survives past one tile
before the next row's offset interrupts it. Transverse joints run across the direction of travel and
cannot be steered by. Bond is preferred over simply lowering joint contrast because it eliminates the
failure mode by construction rather than relying on a contrast ratio holding up at distance and speed.

**No gameplay implication.** Texture only. The simulation never reads `CELL`, collision is continuous
float-AABB, and the threadable-clearance contract `MIN_CLEAR = 7u` is untouched.

**Two constraints we are carrying, and would like held in the direction too:**

1. Joints remain low-contrast value/material divisions, never drawn lines. Board 25's exclusion of
   "fully outlined tile edges" still governs — 16 tiles across the frame becomes a grid if the joints
   read as edges, whatever the bond.
2. Shimmer on the far deck at a 4u pitch is a sampling problem (mips, anisotropic filtering), not a
   reason to revisit the tile size.

**Still open, and narrower than before:** joint *contrast*. Settled by looking at the deck at race
speed, not from a still.
