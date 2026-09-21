---
paths:
  - "apps/client/app/game/**/*.{ts,tsx}"
  - "apps/client/app/net/attach-room-to-world.ts"
---

# ECS (koota)

Full research: `conventions/ecs.md`.

- **Entities are data; systems are plain functions run once per tick.** No methods on entities.
- **React sees add/remove only.** Position, rotation and health are written into the Object3D or a
  typed store inside `useFrame` — never through React state.
- **A trait's presence is the query key.** Model transitions by adding/removing traits (`dead`,
  `stunned`, `networked`), not by branching on values.
- **Change structure only through the library API** (`entity.add`/`remove`). Direct property
  mutation skips re-indexing and the entity silently vanishes from systems.
- **Colyseus is truth; the ECS is a projection.** Keep `Map<networkId, entity>`; split traits into
  networked (server overwrites) vs local-only (interpolation buffers, prediction, VFX) so
  reconciliation never clobbers client state.
- **Narrow queries, long-lived.** No `everything()` filtered with `if`s; never build a query inside
  render.
