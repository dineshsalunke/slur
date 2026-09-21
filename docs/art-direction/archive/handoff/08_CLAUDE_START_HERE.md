# 08 — Claude Start Here

> Read the [current handoff](HANDOVER.md) and [final subject folders](../README.md). Final subject briefs govern their assets; generated annotations never override gameplay dimensions.

You are helping implement and create content for **SLUR**, a fast multiplayer sci-fi ship racer.

The scene/world art direction is frozen in this package. Use the [final subject index](../README.md) and the relevant brief as the art specification.

## Core instruction

> Implement the simplest performant version that preserves the frozen silhouette, color hierarchy, energy language, and gameplay readability.

Do not embellish the art direction. Fewer stronger details are preferred over many small details.

## Non-negotiable visual rules

- Marigold/gainda is the primary gameplay-energy color.
- Environment/background is cold blue-grey/graphite and desaturated.
- Gameplay remains more saturated/readable than background.
- A→B→C changes environment intensity through density, scale, proximity, lighting, and atmosphere—not through arbitrary extra colors.
- Track is dark graphite with finalized procedural wear, broad warm reflections, continuous marigold boundaries and sparse irregular seam inserts.
- Slow blocks and special floors are outside final art scope; do not remove existing mechanics based on this omission.
- Gaps use thin edge glow, slight inner-lip illumination, dark slab cut edges and open void.
- Monoliths are minimal Obelisk/Gate/Arch environmental forms.
- Asteroids use Angular/Plate/Broken families with Elongated/Shattered/Cluster variation. No holed asteroid family.
- Standard obstacle blocks are sealed/solid; destructible blocks are visibly fractured with internal marigold energy.
- Homing Seeker is the **square-profile elongated four-fin design**, not a tapered rocket.

## Simulation / geometry warning

Do not infer a lane-based runtime model from concept art.

SLUR's simulation is continuous. Block widths/depths and placements are continuous, but all block heights are 8u. Gaps are 20u long and at least 4u wide under the reported current implementation. The authoring grid is only scaffolding. Use the current GDD for gameplay geometry contracts.

## First suggested implementation milestone

Build a single vertical slice containing:

- one track material + edge system
- one 4 × 20u partial gap using the readability treatment
- one standard deadly block
- one destructible block with a cheap visual break solution
- one monolith family instance
- one asteroid field preset
- one planet/moon background composition
- A/B/C environment intensity controls
- at least one pickup and its emissive language

Then validate from the real chase camera before creating the full asset library.

## What not to touch yet

Do not treat the current ship concept boards as final production model references. Ship art direction is still being refined and dedicated orthographic passes will happen later.
