# Paste to ChatGPT (Codex) — the edge boundary moves outboard; a departure from board 24 panel 02

*Written 2026-09-20 for the owner to paste. Claude does not edit `docs/art-direction/`.*

---

Decision on the track's edge boundary, taken 2026-09-20. It departs from the package, so it is written
out in full rather than applied quietly.

**The boundary now stands outboard of the deck.** The deck's rendered top face ends at exactly
±`HALF_WIDTH` (±32u, the full 64u ribbon). The boundary is a separate object beside it, occupying
`[32, 33]` and mirrored: a **1u × 1u bar with a 0.15u chamfer on its long edges**, centred at ±32.5u.

**What the package says, quoted.** Board 24 panel 02 places the emitter *"in the top outer corner of
the slab"*, with the dark cut side-face dropping away beneath it, and its do-not-copy column excludes
*"raised rails or ornamental edge machinery"*. Our own material sheet turned that into "a narrow strip
embedded at the deck's outer edge… not a bar standing proud of the floor".

**Why that reading could not be built.** The slab's top face ends at ±32u. Anything *embedded in* that
face must therefore extend **inward**, and every unit of boundary width is a unit of playable floor
repainted as border. That is what shipped: at a 1u boundary the deck was drawn **62u wide while the
player flew 64u**. The simulation's floor spans ±32u unconditionally and has no knowledge of any
rendering-side boundary width, so the inset did not narrow the track — it made the picture disagree with
the physics, and left the player flying on a metre of solid floor that rendered as edge trim.

An edge marker drawn somewhere other than the edge has failed at its one function. This is a gameplay
read, not a style question, which is why it outranks the styling of the boundary.

**The departure, stated plainly.** A 1u bar standing on the deck is a raised rail, and board 24 panel
02 excludes raised rails. We are accepting that departure. The exclusion and "the boundary must not
consume playable width" cannot both hold under the embedded reading — one of them has to give, and it
is not the one that governs how the player reads the edge of the track at speed.

**What we have preserved.** The boundary still reads as golden marigold after tone mapping, never
vermilion or red-orange. It is still unbroken and predictable, distinct from the short, irregular
interior inserts — board 24's actual separation requirement. It is still narrow: 1u against a 64u
ribbon. It still keeps a straight outer boundary where a near-edge gap opens beside it. No red hazard
code, no cyan, no ornament — the chamfer exists so the cold rim light catches a facet instead of a hard
corner, not as decoration.

**The fallback, if you would rather hold the exclusion.** The same bar at **zero height** — a coplanar
inlay sitting outboard of the deck. It satisfies *"must not stand proud of the floor"* literally and
still takes no playable width. We would build that instead on request.

**What is not available in any form** is the original inboard reading. Please do not restate it; it
cannot be implemented without the deck lying about where it ends.

**A request for the direction.** If you agree, we would like the package to carry the invariant
explicitly, in whatever wording you prefer: *no drawn element may consume playable track width; the
deck's rendered surface ends where the simulation's floor ends.* We have recorded it our side as
ADR-012 and in `docs/ART_SCALE_REFERENCE.md` §1a, but it belongs in the direction too, because the next
perimeter element will face the same choice.
