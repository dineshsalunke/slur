---
paths:
  - "apps/server/src/**/*.ts"
  - "packages/shared/src/schema.ts"
  - "apps/client/app/net/**/*.{ts,tsx}"
---

# Colyseus — state & rooms

Full research: `conventions/colyseus.md`.

- **State is the protocol; messages are the commands.** Only synced game state in `Schema`; player
  input goes over `room.send(...)`. Never a Schema instance as a message payload.
- **Append `@type` fields, never reorder or insert.** Encoder and decoder index by declaration
  order — a mismatch silently corrupts decoding. **Keep dead fields plain; never `@deprecated()`.**
  The client decodes by reflection, and a deprecated field shifts the index of every later field.
- **Client SDK is `@colyseus/sdk`**, never `colyseus.js` (frozen at 0.16). Callbacks via
  `getStateCallbacks(room)` → `$`, not `Callbacks.get(room)`.
- **Sim rate and patch rate are independent knobs.** `setSimulationInterval` for physics;
  `patchRate` for flush. Never couple them; never `broadcast()` a full snapshot by hand.
- **Mutate state only inside the sim loop** — never from `onAuth` or async callbacks racing it.
- **`onLeave(client, code)`**: the second arg is a numeric close code, not a boolean. If `onDrop`
  is defined, `onLeave` fires only for consented leaves — don't duplicate cleanup across both.
- **`onChange` on a collection item fires for any field.** Use `.listen("prop", …)` for old/new.
- Cap and prune collections. No unbounded arrays of trails, projectiles or event logs in state.
