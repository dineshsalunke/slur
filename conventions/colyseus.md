# Colyseus Conventions
> Source: https://docs.colyseus.io/ (Rooms, State, SDK, Matchmaker), https://colyseus.io/blog/colyseus-017-is-here/, https://github.com/colyseus/colyseus (CHANGELOG_0.17.md). Versions verified 2026-08-06 against npm + package type defs: `colyseus` (server) **0.17.10** (`next` 0.18.1), `@colyseus/sdk` (client) **0.17.43**, `@colyseus/schema` **4.0.30**. NOTE: the old `colyseus.js` client package is frozen at 0.16.22 — **0.17 clients import from `@colyseus/sdk`.**

## TL;DR — the rules that matter most
- **State is the network protocol, messages are the commands.** Put only synced game state in `Schema`; send player *input* as `room.send(...)` messages. Never stuff transient/message data into Schema, and never use Schema for message payloads (docs say so explicitly).
- **The server owns the simulation.** Clients send intent (thrust/steer/fire), the server runs a fixed-timestep loop via `setSimulationInterval` and mutates state; clients render `room.state` + interpolate. Never trust client-reported positions.
- **Decouple sim rate from patch rate.** `setSimulationInterval` runs your physics (aim ~30–60 Hz); `patchRate` (default **50 ms / 20 Hz**) controls how often deltas flush to clients. These are independent knobs — tune separately.
- **Only `@type()`-decorated fields sync, and only deltas go over the wire.** Mutating a `@type` field inside the sim loop is the entire sync mechanism. Field order must be identical on encoder/decoder — append new fields, never reorder.
- **0.17 client API: `getStateCallbacks(room)` → `$`**, then `$(room.state).players.onAdd(...)` / `$(entity).listen(...)`. (`Callbacks.get(room)` is *not* the idiomatic entry point.)
- **Reconnection is first-class in 0.17.** `onDrop()` + `allowReconnection()` on the server, automatic reconnect on the client — essential when someone's laptop sleeps mid-race on office WiFi.
- **Host-launched rooms = `create`/`joinOrCreate` once, share `room.roomId`, others `joinById(roomId)`.** Lock the room with `maxClients` and optionally `this.lock()` once the run is full.
- **In a TS monorepo, share the `Schema` classes as a package and import them on both sides** — JS/TS clients rebuild the schema via Reflection at runtime, so no codegen is needed.

## Idiomatic Patterns

**Schema (shared package, imported by client + server)**
```typescript
import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("float32") x = 0;
  @type("float32") z = 0;
  @type("float32") vel = 0;          // forward speed
  @type("float32") heading = 0;
  @type("uint8")  lap = 0;
  @type("uint8")  hp = 100;
  @type("string") powerup = "";
  @type("boolean") connected = true; // flip on drop/reconnect
}

export class RaceState extends Schema {
  @type("uint8") phase = 0;          // 0=lobby 1=running 2=finished
  @type("float32") elapsed = 0;
  @type({ map: Player }) players = new MapSchema<Player>();
}
```

**Room lifecycle + fixed-timestep server-authoritative sim**
```typescript
import { Room, Client } from "colyseus";
import { RaceState, Player } from "@slur/shared";

const TICK = 1000 / 60; // 60 Hz sim

export class RaceRoom extends Room<{ state: RaceState }> {
  maxClients = 12;
  private inputs = new Map<string, { thrust: number; steer: number }>();

  onCreate() {
    this.state = new RaceState();
    this.patchRate = 50; // 20 Hz network flush (default)

    this.onMessage("input", (client, msg: { thrust: number; steer: number }) => {
      this.inputs.set(client.sessionId, msg);   // buffer, apply in sim loop
    });

    let acc = 0;
    this.setSimulationInterval((dt) => {         // dt in ms
      acc += dt;
      while (acc >= TICK) { this.fixedUpdate(TICK / 1000); acc -= TICK; }
    });
  }

  private fixedUpdate(dt: number) {
    this.state.players.forEach((p, id) => {
      const inp = this.inputs.get(id);
      if (!inp || !p.connected) return;
      p.vel = Math.min(p.vel + inp.thrust * 40 * dt, MAX_SPEED);
      p.heading += inp.steer * 2.5 * dt;
      p.x += Math.sin(p.heading) * p.vel * dt;
      p.z += Math.cos(p.heading) * p.vel * dt;
    });
    this.state.elapsed += dt;
  }

  onJoin(client: Client, options: { name: string }) {
    const p = new Player();
    this.state.players.set(client.sessionId, p); // join-mid-run: just add
  }

  async onDrop(client: Client) {                 // abnormal disconnect
    const p = this.state.players.get(client.sessionId);
    if (p) p.connected = false;
    try { await this.allowReconnection(client, 20); p!.connected = true; }
    catch { this.state.players.delete(client.sessionId); }
  }

  onReconnect(client: Client) {
    this.state.players.get(client.sessionId)!.connected = true;
  }

  onLeave(client: Client, code: number) {        // consented / after onDrop rejects
    this.inputs.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
  }

  onDispose() { /* persist results if needed */ }
}
```

**Client SDK (React Three Fiber): join + state callbacks + input**
```typescript
import { Client, getStateCallbacks } from "@colyseus/sdk";
import type { RaceState } from "@slur/shared";

const client = new Client("ws://<host-lan-ip>:2567");

// Host creates; everyone else joins the shared id
const room = isHost
  ? await client.create<RaceState>("race", { name })
  : await client.joinById<RaceState>(roomId, { name });

const $ = getStateCallbacks(room);
$(room.state).players.onAdd((player, sessionId) => {
  spawnShipMesh(sessionId);
  $(player).onChange(() => updateShip(sessionId, player.x, player.z, player.heading));
});
$(room.state).players.onRemove((_p, sessionId) => despawnShip(sessionId));
$(room.state).listen("phase", (phase) => setGamePhase(phase));

// Send input at a fixed cadence, NOT every render frame:
setInterval(() => room.send("input", { thrust, steer }), 1000 / 30);

room.onMessage("hit", (m) => playHitFx(m));
```

**Per-client visibility (StateView, replaces `@filter`)** — only if you need fog/hidden pickups:
```typescript
class Player extends Schema {
  @type("float32") x = 0;                  // visible to all
  @view() @type("string") nextPowerup = ""; // only owner's view sees it
}
// onJoin:
client.view = new StateView();
client.view.add(this.state.players.get(client.sessionId));
```

## Best Practices
- **Fixed timestep with an accumulator** (see `fixedUpdate` above): deterministic physics independent of `setSimulationInterval` jitter. Pass an explicit interval to `setSimulationInterval` and keep the internal step constant.
- **Buffer inputs, apply in the loop.** Message handlers write to a plain `Map`; the sim loop reads it. Keeps mutation on one clock and avoids mid-tick state churn.
- **Pick the tightest primitive type.** `uint8` for hp/lap, `float32` for positions. Every byte is multiplied by player count × patch rate.
- **Use `@type` collections (`MapSchema`/`ArraySchema`) via their methods** (`.set/.delete/.push`) — these are what generate deltas. Key players by `sessionId`.
- **Set `maxClients` and lock when full.** `this.lock()` once phase→running if you don't want late joiners; leave unlocked to allow join-mid-run.
- **Reconnection window sized to the medium:** LAN sleep/wake is short — 15–30 s in `allowReconnection` is plenty; mark `connected=false` so peers can ghost the ship.
- **`sendUnreliable` for high-frequency, loss-tolerant client→server input** if you raise input rate; reliable `send` for discrete actions (fire, use-powerup).
- **Batch related callbacks** and always keep the detach functions (`onAdd`/`listen` return an unbind) — call them on unmount to avoid leaks in React.
- **Keep the `Schema` package framework-free** so both a Node server and a browser bundle can import it cleanly.

## Anti-Patterns & Bad Practices
- **Putting non-state data in Schema** — WHY: Schema is a delta-synced binary protocol; junk fields get serialized to every client every patch. Use messages.
- **Using Schema instances as message payloads** — WHY: docs explicitly forbid it; messages aren't part of the delta stream and won't decode as you expect.
- **Sending input every render frame (60–144 Hz)** — WHY: floods the server with messages (0.17 can even rate-limit via `maxMessagesPerSecond`); 20–30 Hz input is imperceptibly different and far cheaper.
- **Trusting client-sent positions / doing movement on the client** — WHY: destroys authority; any client can teleport/speedhack. Send intent, compute on server.
- **Mutating state outside the patch/sim cycle** (e.g. inside `onAuth`, async callbacks racing the loop) — WHY: leads to torn/interleaved deltas and hard-to-reproduce desync; funnel all mutation through the sim loop.
- **Coupling `patchRate` to sim rate** (e.g. patchRate=16 to match 60 Hz) — WHY: triples bandwidth for no visual gain; clients interpolate between 20 Hz snapshots fine.
- **Broadcasting full snapshots manually** (`broadcast("state", entireState)`) — WHY: reinvents (badly) the delta encoder that already runs on `patchRate`.
- **Reordering / inserting `@type` fields in the middle** — WHY: encoder and decoder index fields by declaration order; a mismatch silently corrupts decoding. Append only; mark dead fields `@deprecated()`.
- **One giant flat state / unbounded arrays** (trails, projectiles, event logs kept forever) — WHY: state bloat balloons every patch; cap/prune collections and expire transient entities.
- **`@view()` on large hot datasets** — WHY: StateView filtering is per-client work and docs note it's "not optimized" for very large sets; use it sparingly (secrets, ownership), not as a general LOD system at scale.

## Gotchas / Footguns
- **Wrong client package:** `npm i colyseus.js` gets you a 0.16 client. For a 0.17 server use **`@colyseus/sdk`**. `getStateCallbacks` lives there.
- **`onLeave(client, code)` signature changed in 0.17** — second arg is now a numeric close **code**, not a `consented` boolean. Branch on the code, not truthiness.
- **`onDrop` vs `onLeave`:** if you define `onDrop`, `onLeave` fires only for consented leaves (and after a reconnection window rejects); if you *don't* define `onDrop`, `onLeave` fires for all disconnects. Don't duplicate cleanup across both.
- **`onChange` on a collection item fires for *any* field change**, not per-field. Use `.listen("prop", …)` when you need the specific old/new value.
- **`patchRate` semantics changed in 0.17:** `patchRate = null` disables automatic patches; `patchRate = 0` no longer breaks clock timers (old bug). Don't set 0 expecting "off".
- **0.17 Room generic is `Room<{ state?, metadata?, client? }>`**, not `Room<State, Metadata>`. Migrating old snippets will type-error.
- **Seat reservation timeout is now a property** — `this.seatReservationTimeout = n`, not `setSeatReservationTime(n)`.
- **State callbacks need the reflected/decoded state**, which arrives after join handshake — register callbacks on the returned `room`, and expect `onAdd` to fire immediately for entities already present (join-mid-run relies on this).
- **`float32` precision:** positions accumulate error over a long track; that's fine for rendering but don't use synced floats for authoritative collision thresholds without epsilon.
- **Close codes moved:** `Protocol.WS_*` → `CloseCode.*` in 0.17.

## For This Project
Host-launched LAN ship-runner with join-mid-run, ~2–12 players, R3F client, pnpm monorepo:
- **Room creation:** the host client calls `client.create<RaceState>("race", opts)` (or `joinOrCreate`) and reads `room.roomId`. Surface that id (short code / QR / mDNS-discovered lobby) so office peers call `client.joinById(roomId)`. No public matchmaking needed on a LAN — you can even set `filterBy`/keep rooms private and rely purely on join-by-id.
- **Join-mid-run works out of the box:** `onJoin` just `players.set(...)`; the newcomer's SDK receives current state on handshake and `onAdd` fires for every existing ship. Set the new player's `x/z` to a spawn/checkpoint appropriate to `state.phase`/`elapsed` so they don't appear at the start line during a live race.
- **Authority + rates:** 60 Hz `setSimulationInterval` with accumulator for ship physics, power-up pickups, and PvP hit resolution; keep `patchRate` at the 50 ms default. Input at 30 Hz via `room.send("input", …)`; discrete combat actions (fire, deploy-mine, use-boost) as their own reliable messages. Client renders `room.state` and interpolates between patches; optionally client-side predict the *local* ship and reconcile on `onChange`.
- **Reconnection:** office WiFi drops and lid-close are common — implement `onDrop`→`allowReconnection(client, 20)` + `connected` flag; ghost/greyed ships while `connected===false`. Client 0.17 auto-reconnects; cache `room.reconnectionToken` for manual `client.reconnect(token)` fallback.
- **Shared schema:** put `RaceState`/`Player` in `packages/shared` (`@slur/shared`), imported by both the `colyseus` server and the R3F client. TS clients rebuild the schema via Reflection at runtime — no codegen, no manual sync, single source of truth. Keep the package dependency-light (only `@colyseus/schema`).
- **Combat/power-ups state hygiene:** model active power-ups as small fields on `Player` (`uint8` id + expiry tick), not as an ever-growing array of events. Represent projectiles/mines as a `MapSchema` you actively prune when they expire or hit — never an append-only log. Broadcast one-shot FX (explosion at x,z) as messages, not state.
- **Optional StateView:** only if you want hidden/mystery power-ups or a "fog" mechanic — mark the secret field `@view()` and add the owner's `Player` to `client.view`. At 12 players it's cheap; don't build core visibility on it beyond that.

## References
- Colyseus docs — Rooms/lifecycle: https://docs.colyseus.io/room (v0.17, fetched 2026-08-06)
- Colyseus docs — State / Schema: https://docs.colyseus.io/state and https://docs.colyseus.io/state/schema (v0.17)
- Colyseus docs — StateView (per-client filtering): https://docs.colyseus.io/state/view (v0.17)
- Colyseus docs — Client SDK: https://docs.colyseus.io/sdk and state sync callbacks under /sdk (v0.17)
- Colyseus docs — Matchmaker (createRoom/joinById/reserveSeatFor/consumeSeatReservation): https://docs.colyseus.io/matchmaker (v0.17)
- Colyseus 0.17 release notes: https://colyseus.io/blog/colyseus-017-is-here/ (2026-02-06)
- 0.17 changelog: https://github.com/colyseus/colyseus/blob/master/CHANGELOG_0.17.md
- Verified via npm + bundled type defs (2026-08-06): `colyseus@0.17.10`, `@colyseus/sdk@0.17.43` (exports `getStateCallbacks`, `Client`, `Room`), `@colyseus/schema@4.0.30` (exports `getDecoderStateCallbacks`, `CallbackProxy`/`CollectionCallback` with `onAdd/onRemove/onChange/listen`)
