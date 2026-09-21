---
paths:
  - "packages/shared/src/sim/**/*.ts"
  - "packages/shared/src/constants.ts"
  - "apps/client/app/game/scene/**/*.tsx"
---

# Track space & the CELL grid

Full contract: **GDD §0** — read it before any track, geometry, ship-size or collision work.
Generator internals: ADR-006 / ADR-007 in `docs/DECISIONS.md`.

- **Space is continuous. `CELL = 4u` is an authoring snap grid only** — the design-time snap
  increment for all authoring, procgen and hand-authored alike.
- **It is not a runtime unit, not a movement snap, not a block-size rule.** The sim never reads it;
  collision is continuous float-AABB in `step.ts`.
- **Blocks may be any size** (`5.5×5.5×8u`, …). Never assume cell multiples.
- **One load-bearing spatial invariant: threadable clearance** at every z-slice. The constants and
  the roster-conformance rule live in GDD §0 — read them there.
- **Never hand-type a width against the grid.** That produced the stale "Freighter 3.6u" bug.
