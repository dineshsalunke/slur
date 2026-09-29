---
paths:
  - "apps/client/app/game/**/*.{ts,tsx}"
  - "apps/client/app/features/**/*.{ts,tsx}"
  - "apps/client/app/engine/**/*.{ts,tsx}"
  - "apps/client/app/net/attach-room-to-world.ts"
---

# ECS (koota)

Full research: `conventions/ecs.md`. Project rules: `conventions/features.md`.

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
- **Rule C — one home per kind of state.** A thing in the race is an entity. Its state is a tag
  (`Dead`, `Stunned`, `Shielded`, `Spectating`), never a value branch. Run-wide state (phase,
  spectator target, standings, blocks, power slot, run config) is a world trait read with
  `useTrait( world, T )`. A service (room, audio, input devices, dev tools, quality) stays a module
  singleton.
- **One run reset** removes per-run world traits, destroys the run's entities and calls each feature's
  `run.reset`. Nothing else holds per-run state.
- **Events carry an entity reference, not a session-id string.** The server has no koota.
