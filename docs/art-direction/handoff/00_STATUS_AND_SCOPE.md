# 00 — Status & Scope

> Read the [current handoff](HANDOVER.md) and [final subject folders](../README.md). Final subject briefs govern their assets; generated annotations never override gameplay dimensions.

## Frozen and safe to implement

The following are frozen for scene/world production:

- Core color palette and visual hierarchy
- A → B → C environmental intensity system
- Monolith language
- Asteroid language
- Planets & moons language
- Sector composition language
- Track surface / boundary / finish-line language
- Gap language, including small-gap readability treatment
- Standard deadly blocks
- Destructible block visual language
- Pickup/weapon family currently shown in the final pickup sheet
- Final **square / 4-fin** Homing Seeker direction

## Not finalized

- Final ship designs and ship orthographic model sheets
- Ship-specific VFX polish beyond the general warm-energy language
- HUD typography, responsive sizing, interaction states and rear-camera implementation; compact borderless styling and content placement are finalized
- Exact production mesh topology / texture budgets / shader implementation

Ship art direction will continue independently and should **not block environment production**.

## Important: art versus implementation

A visual decision can be frozen while implementation remains flexible.

Example: destructible blocks must *read as fractured and breakable*. This does **not** require runtime mesh fracturing. A pre-fractured mesh, mesh swap or procedural form may be used. A crack mask or emissive shader alone cannot replace the required broken outer contours.

## Do not infer from concept art

The concept sheets contain visualized examples. Do **not** turn incidental visual details into simulation rules.

Especially:

- Do not implement a gameplay grid because a board shows panel divisions.
- Do not assume a fixed lane count from any art board.
- Do not assume gaps or blocks are quantized to cells.
- Do not add slow blocks or special floors. They are **not part of the frozen art scope**.
- Do not add decorative greebling simply because a generated image contains it.
- Do not treat generated text or numeric scales printed inside concept boards as authoritative.

The simulation is continuous. Authoring grid/cells are scaffolding, not a runtime visual/gameplay law.
