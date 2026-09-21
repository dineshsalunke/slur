---
paths:
  - "packages/shared/src/sim/**/*.ts"
  - "apps/server/src/rooms/**/*.ts"
  - "apps/client/app/net/**/*.{ts,tsx}"
---

# Netcode

Full research: `conventions/netcode.md`.

- **Clients send inputs, never positions.** Every input carries a monotonic `seq`; the server echoes
  the last-processed seq so the client can reconcile.
- **Predict locally, then reconcile:** on each snapshot, snap to authority and replay every
  unacknowledged input.
- **Interpolate remote ships** ~one snapshot in the past. Never extrapolate as the default; never
  render them at zero delay.
- **One shared `simulate()`, fixed timestep, same `dt` on both ends.** Accumulator with a max-steps
  clamp — never tick physics off raw wall-clock delta.
- **Three independent clocks:** sim tick, network patch, render. Never conflate them.
- **Hits, damage, spawns and pickups are server decisions.** The client may show cosmetic tracers
  and muzzle flash immediately; damage is not the client's call.
- **Track seed/descriptor lives in server state** — a client-chosen seed desyncs the world.
- LAN baseline: no full lag compensation yet. Keep the architecture able to add it; don't pay now.
