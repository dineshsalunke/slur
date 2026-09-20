# The side rail — cross-section profile (owner's sketch, 2026-09-20)

Supersedes the "1u × 1u chamfered bar" shape recorded in ADR-012. **The invariant is unchanged and
still governs: the deck's rendered top face ends at exactly ±`HALF_WIDTH`; the rail is outboard.**
Only the rail's own section changes.

## What it is

**A metal extrusion with a trapezoidal channel milled into its top, with the emissive strip seated in
the channel and standing slightly proud of the metal.** An LED-in-an-aluminium-channel section — not a
solid glowing bar. Two materials: the body is metal (M1 family), the seated strip is the emitter (M7).

```
        <----------- 4u ----------->
        |    <------ 3u ------>    |
         ___   ___________   ___            <- emissive, proud of the metal, WIDE at top
        |   \ /###########\ /   |           <- channel walls angle inward going DOWN
        |    X#############X    |           <- 0.5u metal lip each side
   _____|                       |_____
        |                       |
        |  (skirt)              | (skirt)   <- outer and inner skirts drop below the deck line
   x = 32                    x = 36
   (deck edge)               (outer face)
```

## Dimensions — from the owner, "roughly, not to scale"

| Parameter | Value | Status |
|---|---:|---|
| Total rail width | **4u** | given — occupies `[32, 36]`, mirrored `[-36, -32]` |
| Emissive strip width (at its top) | **3u** | given |
| Metal lip each side | **0.5u** | derived = (4 − 3) / 2 |
| Rail body height above the deck | — | **OPEN** |
| Channel depth | — | **OPEN** |
| How proud the emissive stands | — | **OPEN** — the sketch shows it above the metal, amount unstated |
| Channel wall angle | — | **OPEN** — or derive it from channel depth + a chosen base width |
| Skirt depth (below deck top, outer + inner) | — | **OPEN** |

## Settled by the sketch, don't re-ask

- The **inner skirt sits against the deck's outer wall** — the rail's inner face is at `x = 32`, flush.
- The channel is **trapezoidal, narrowing downward** (emissive wide at top). Not a square slot.
- The emissive is **seated in the channel**, never applied to a flat top face.

## Why this section is better than the solid bar, beyond looks

**The lips shield the emitter at grazing angles.** The bloom-bleed-over-the-wing question — accepted as
tolerable on the solid bar, with an inner-face offset parked as polish — is largely answered by this
geometry: from a chase cam hugging the edge, the inner 0.5u lip occludes the strip's inner edge. The
parked offset knob may turn out to be unnecessary. **Re-judge it after this profile is built; do not
build the offset first.**

## To judge once it is built

- The 0.15u top-edge chamfer decision (owner: top edges only) applies to the **metal body's** outer top
  edge. The channel walls are already angled; they are not a separate chamfer.
- A 4u rail per side widens the visual ribbon from 64u to 72u. Judge the silhouette at speed.
- Raised metal on the **far** rail occludes a band of far deck at the 7.5u chase height — small, but
  the far rail is what lateral position is read from at speed. Worth one look.
- Gap behaviour (break over full-width gaps, or run continuous) is still undecided — carried from
  ADR-012's "not decided here".
