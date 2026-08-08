# S2 — Networked flight (server-authoritative) — BRAINSTORM

**Goal / done-when:** two laptops fly the same seeded track and see each other move smoothly.
One flat track, no hazards/combat/lobby. The point is to **de-risk the netcode + the
schema-decorator footgun** while the surface is tiny (one ship type, ≤12 players).

> Phase: Brainstorm (collaborative). Conventions read this session: `colyseus.md`, `netcode.md`,
> `ecs.md`. Next phase: Prep (carve the narrow implement slice + concrete diff shape).

---

## Transport rationale — why TCP/WebSocket (Colyseus), not UDP

Competitive real-time games use UDP to dodge **TCP head-of-line blocking** (a lost packet stalls
everything behind it until retransmit; stale real-time state is worthless). UDP games then rebuild
*only* the reliability they need: snapshots that supersede (no retransmit), input redundancy
(resend last N inputs, dedupe by seq), delta-vs-last-acked encoding, and an interpolation buffer
that absorbs jitter/loss.

**None of that machinery is needed for us**, because:
- **Wired office LAN:** loss ≈ 0, RTT ≈ 0.5–5ms, retransmit sub-ms → HOL blocking (the whole
  reason to prefer UDP) almost never fires.
- **Browser constraint:** a browser can't open a raw UDP socket. Options are WebSocket (TCP),
  WebRTC DataChannel (unreliable, painful signaling), or WebTransport (QUIC/UDP, newer). Colyseus
  chose **WebSocket/TCP** — "just use UDP" isn't freely available anyway.
- **The latency-hiding techniques are transport-independent** — prediction, interpolation, server
  authority live *above* the wire.

**Stance:** build the architecture for the internet (inputs+seqs, prediction, interpolation,
authority — hard to retrofit); skip the transport tricks the LAN makes invisible (loss redundancy,
delta-vs-acked, UDP, lag-comp — easy to add later). **Upgrade path** if SLUR ever leaves the LAN:
swap transport to WebTransport/WebRTC — would *not* touch `simulate()`/reconciliation/interpolation.
*(Caveat: whether Colyseus supports a drop-in UDP/WebTransport swap is unverified — treat as the
shape of the fix, not a promised feature.)*

### Colyseus handles vs. we build (the "partially handled" split)
- **Colyseus (don't build):** TCP/WS connection + reconnect primitives; **delta-encoded state sync**
  (mutate `@type` fields → it diffs & ships changes at `patchRate` 20Hz); **full-state-on-join**;
  message channel for discrete events.
- **We build:** the shared `simulate()` sim loop; client **prediction + reconciliation** (local
  ship); **entity interpolation** (remote ships); seq numbers + `lastProcessedInput` convention.

---

## The reframe: S2 is TWO reconciliations, not one

| | **Local ship** | **Remote ships** |
|---|---|---|
| Mechanism | predict via `simulate()` → **reconcile by replay** (snap to authoritative, drop acked inputs, re-run pending) | **interpolate** — ease `RenderTransform` → buffered `ServerTransform`, render ~50–100ms in the past |
| Runs `simulate()`? | yes (every tick + every replay) | **never** |
| Needs from snapshot | the **full `SimShip`** (incl. transient jump timers) | just `x,y,z` (+ rotation from `vx`) |
| koota traits | `Sim` (predicted, AoS live) + pending-input buffer | `ServerTransform` + `RenderTransform` (no `Sim`) |

The ecs.md `reconcile()`+`interpSystem` snippet is the **remote** pattern; netcode.md snap-and-replay
is the **local** pattern. S2 builds both; they diverge in koota trait layout.

**Key insight:** correct local replay needs the **full SimShip in the snapshot including transient
timers** (`coyoteTimer`, `bufferTimer`, `jumpHeld`, `jumpsUsed`) because `simulate()` reads them.
The "minimal wire state" instinct is *wrong* for the local ship — omitting timers mispredicts jumps.

---

## Decisions (proposed in brainstorm)

- **D1 — Schema IS the SimShip.** `PlayerState` schema declares every `SimShip` field (`@type`),
  structurally satisfies `SimShip`; server runs `simulate()` *directly on the schema instance*
  (mutations auto-generate deltas). Plus `lastProcessedInput` (extra field, sim ignores it). Syncing
  ~4 transient floats/bools every tick is nothing on LAN. The real risk is the footgun S2 exists to
  kill: `@type` field-order (append-never-reorder) + `experimentalDecorators` surviving the `tsc`
  compile of `@slur/shared`. Alternative (plain SimShip + copy→minimal schema) buys nothing on LAN.
- **D2 — Sim stays framework-free.** New `packages/shared/src/schema.ts` imports `@colyseus/schema`;
  `sim/step.ts` stays pure. `simulate(playerStateInstance, …)` typechecks by **structural typing**.
  Both exported from `index.ts`. (Non-negotiable #5.)
- **D3 — Input: one input per tick, batched send ~30Hz.** Replace S1's single reused input object
  with a **pending ring buffer of value-copied `{seq, …input}`** for replay. Server drains its
  per-player queue each tick, so 1-input-per-tick correctness holds regardless of batch size (cadence
  = bandwidth knob). Fallback: 60Hz singles. Both fine on LAN.

## Decisions (user calls, 2026-08-07)

- **C1 — Scope = FULL netcode triad.** Prediction + reconciliation + remote interpolation, built as
  3 verifiable steps. Skipping any defers the risk instead of killing it.
- **C2 — Reconnection INCLUDED in S2** (user overrode the "defer to S4" lean). `onDrop` →
  `allowReconnection(20)` + `connected` flag; ghost/grey remote ships while `connected===false`.
  Rationale: office WiFi/lid-close is the realistic failure mode; cheaper to build now at one-ship
  surface than to retrofit in S4. (Backlog S4 line should drop reconnection accordingly at reconcile.)
- **C3 — Route = `/run`** (new), doing `joinOrCreate("run")` against a single default room (tab 1
  creates, tab 2 joins). Keep `/solo` as the offline predict-only sandbox for feel-tuning. Room-code /
  join-by-id / lobby is S4.
- **C4 — Connection lifecycle: `Client` singleton + thin room context + join-in-loader.** RR8
  framework-mode SPA. Three parts:
  - **`Client` = module singleton** (`net/client.ts`, `new Client(url)`) — created once, importable by
    both `clientLoader` and components (a loader runs *outside* React and can't read a Provider, so a
    singleton is what makes loader-access work).
  - **Join happens in `clientLoader`** — `client.joinOrCreate("run")`, stashed on a module session
    holder + returned as loader data (gives RR's pending UI + `ErrorBoundary` on join failure).
    Guard with **`shouldRevalidate: () => false`** (belt-and-suspenders, not load-bearing).
  - **Thin room context provider** exposes the room to React, owns the **mutable** room ref for
    reconnection swaps (C2) + teardown (`room.leave()` on unmount).

  **Why context, not just loader data** (revalidation is NOT the reason — a param-less single
  gameplay route never revalidates from param/search changes):
  1. **Decisive — Colyseus lobby & game are the SAME room.** `RaceState.phase` (0=lobby→1=running→
     2=finished, per `colyseus.md`): players join at the lobby phase; the *same room* transitions to
     running. So the room is born at the lobby route and must **survive lobby→gameplay navigation** —
     a value outliving a navigation can't be owned by the destination route's loader → it lives above
     the router. (This *preserves* join-in-loader: it just becomes the **lobby route's** loader in S4.)
  2. **Reconnection (C2) needs mutable room state** — a drop/reconnect changes room state (and maybe
     the room ref) *mid-mount*; loader data is an immutable per-navigation snapshot and can't represent
     that. Needs `useRef`/`useState`-backed context. *(Whether `client.reconnect()` returns a new Room
     is recalled/unverified; the mutability need holds either way via the `connected` flag.)*
  3. **Minor — loader-abort leak:** a socket opened in a loader for a navigation that aborts before
     commit has no teardown hook unless the loader's `AbortSignal` is wired to `room.leave()`.

  **S2 vs S4 evolution:** S2 has no lobby route → the join lives in **`/run`'s `clientLoader`** now,
  with the `Client` singleton + thin context built now (so reconnection has a home). **S4** slots a
  lobby route in front: the *join* moves to the **lobby loader**, the room's ownership stays in the
  context above the router, and `/run` demotes to a `requireRoom` middleware guard — no rework of the
  singleton/context.

---

## Scope

**IN:** ≥2 ships; server authority via `RunRoom` (fixed 60Hz accumulator loop, drains buffered
inputs, records `lastProcessedInput`); `patchRate` 50ms; shared `simulate()` server-side; client
sends seq inputs; **predict local + reconcile-by-replay**; **interpolate remotes** (~50–100ms);
join-mid-run (server-chosen spawn, staggered); **basic reconnection** (C2); track **seed in RunState**
(deterministic scenery); `/run` route; keep flat floor + side-wall collision from S1.

**OUT (later slices):** real track + hazards + finish + collision + bloom (S3); lobby/rooms/results/
spawn-beside-moving-pack (S4); combat + rearview (S5); ship classes/audio/juice (S6). Also deferred
(premature on LAN): lag compensation, hermite interpolation, error-blend smoothing, UDP/WebTransport.

---

## Top risks (what Prep must nail)
1. **Schema-decorator footgun** — `experimentalDecorators` through the `tsc` build of shared; `@type`
   field order append-only; verify a schema instance structurally satisfies `SimShip` at compile time.
2. **Local reconciliation correctness** — full-SimShip snapshot + pending-input replay; jump timers
   must round-trip or jumps mispredict.
3. **koota trait split** — local (`Sim` + pending buffer) vs remote (`ServerTransform`/`RenderTransform`);
   reconciliation must never clobber local-only interpolation/prediction state (ecs.md).
4. **Seq ↔ tick mapping** — one seq per fixed-step; pending buffer holds value-copies, not the reused
   input object.

## Open for Prep
- Exact `PlayerState`/`RunState` field lists + `@type` primitive choices (float32 vs uint8).
- Where the pending-input buffer + reconciliation live (client module layout).
- `/run` connection lifecycle: **decided in C4** (singleton + thin context + join-in-loader). Prep to
  detail the module layout (`net/client.ts`, session holder, room-context provider) + `getStateCallbacks`
  wiring → onAdd spawns koota entity → local vs remote branching by `room.sessionId`.
- Verify-at-implement: does the schema class structurally satisfy `SimShip`; `experimentalDecorators`
  survives shared's tsc build; `@colyseus/sdk` `getStateCallbacks` shape.

---

# S2 — PREP (implement spec for background agent)

**Verified ground truth (this session, 2026-08-07):**
- `tsconfig.base.json` already has `experimentalDecorators: true` + `useDefineForClassFields: false`
  (schema 4.0.30 README requires exactly this) + `verbatimModuleSyntax: true`.
- `@colyseus/schema@4.0.30` is already a dep of `@slur/shared`. R3F 9 / drei / koota 0.6.6 / three
  0.185 already installed on client. Server has `@colyseus/core` 0.17.47 + `@colyseus/ws-transport` +
  express. Server `index.ts` has a `gameServer.define(ROOM_NAME, RunRoom)` seam.
- **`@colyseus/sdk` is NOT installed** (latest 0.17.43).
- Existing sim: `simulate(s, input, dt, t)` in `packages/shared/src/sim/step.ts`; `SimShip` in
  `sim/types.ts` = `{x,y,z,vx,vy,vz,energy,grounded,jumpsUsed,jumpHeld,coyoteTimer,bufferTimer}`;
  `PlayerInput` in `sim/input.ts`; `createFixedStep`/`FIXED_DT`/`TICK_RATE` in `sim/fixed-step.ts` +
  `constants.ts`; `DEFAULT_TUNING` in `constants.ts`.
- Client routes today: `home`, `solo` (offline sandbox — **leave untouched**).

## Build in 3 verifiable steps (each ends green: `pnpm typecheck && pnpm build`)

### STEP 1 — shared wire contract (the footgun step)
`packages/shared/src/schema.ts` (NEW). **Field declaration order = wire format; APPEND-ONLY.**
`import { Schema, MapSchema, type } from "@colyseus/schema"` (value import — `type` is the decorator,
NOT `import type`). `import type { SimShip } from "./sim/types.js"`.
```ts
export const ROOM_NAME = "run";
export class PlayerState extends Schema implements SimShip {   // implements = compile-time footgun guard
  @type("float32") x = 0; @type("float32") y = 0; @type("float32") z = 0;
  @type("float32") vx = 0; @type("float32") vy = 0; @type("float32") vz = 0;
  @type("float32") energy = 100;
  @type("boolean") grounded = true;          // transient jump state — MUST sync for correct local replay
  @type("uint8")   jumpsUsed = 0;
  @type("boolean") jumpHeld = false;
  @type("float32") coyoteTimer = 0;
  @type("float32") bufferTimer = 0;
  @type("uint32")  lastProcessedInput = 0;   // netcode bookkeeping (not SimShip)
  @type("boolean") connected = true;
}
export class RunState extends Schema {
  @type("uint8")   phase = 1;                 // S2 stays running(1); lobby/finished are S4
  @type("float32") elapsed = 0;
  @type("uint32")  seed = 1234;
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
```
Also define the input wire message type (plain object, NOT a Schema — colyseus.md forbids Schema as
message payload). Reuse `PlayerInput`; message = `{ inputs: PlayerInput[] }` (batched). Export from
`index.ts`. **Verify:** `implements SimShip` compiles (proves structural match) and `pnpm build`
regenerates `dist` clean.

### STEP 2 — server authority (`@slur/server`)
`apps/server/src/rooms/run-room.ts` (NEW). Register in `index.ts` via the existing seam.
- `maxClients = 12`. `onCreate`: `this.state = new RunState()`; random `seed`; `this.patchRate = 50`.
- Per-player input queue `Map<sessionId, PlayerInput[]>`; **cap length** (drop oldest past ~120) to
  resist floods.
- `setSimulationInterval` + accumulator at `FIXED_DT`; per fixed step, for each player drain its queue:
  `simulate(player, input, FIXED_DT, DEFAULT_TUNING); player.lastProcessedInput = input.seq;`
  (PlayerState structurally satisfies SimShip → mutations are tracked deltas). Clamp max steps/frame
  (~5). `state.elapsed += dt`.
- `onMessage("input", (client,msg) => queue.push(...msg.inputs))`.
- `onJoin`: `new PlayerState()`, stagger spawn `x` by current player count (e.g. `(n-…)*4`), `z=0`,
  `players.set(sessionId, p)`.
- `onDrop`: `p.connected=false; try{ await allowReconnection(client,20); p.connected=true } catch { players.delete; queue.delete }`.
- `onLeave` (consented / post-reject): `queue.delete`, `players.delete` (guard double-cleanup vs onDrop).
- `onReconnect`: `connected=true`.

### STEP 3 — client (`@slur/client`): connection + prediction + interpolation
**Deps:** add `'@colyseus/sdk': ^0.17.43` to the catalog + `"@colyseus/sdk": "catalog:"` to client;
`pnpm install`. If blocked by `minimumReleaseAge`, add `@colyseus/sdk@0.17.43` to
`minimumReleaseAgeExclude` in `pnpm-workspace.yaml`.

**Connection (C4 — singleton + thin context + join-in-loader):**
- `app/net/client.ts`: **lazy** singleton — `let c; export const getClient = () => (c ??= new Client(url))`
  where `url` derives from `window.location.hostname` + `:2567` (lazy keeps root prerender SSR-safe).
- `app/net/session.ts`: module holder `{ room: Room<RunState> | null }`.
- `app/routes/run/route.tsx`: `export async function clientLoader() { const room = await getClient().joinOrCreate<RunState>(ROOM_NAME); session.room = room; return { room }; }`
  `export function shouldRevalidate() { return false }`. `HydrateFallback` = "Connecting…".
  Component wraps `<RoomProvider room={loaderData.room}><NetCanvas/></RoomProvider>`.
- `app/net/room-context.tsx`: `RoomProvider` holds room in a ref/state (mutable for reconnection),
  `useRoom()`; on unmount `room.leave()`. Register `run` in `app/routes.ts`. Link from `home`.

**ECS trait split (`app/game/ecs/traits.ts`):** keep `Sim`, `Prev`, `Render`, `LocalPlayer`. Add:
- `Net = trait({ sessionId: '' })` — on every networked ship (local + remote).
- `Remote = trait()` — tag for interpolated ships.
- `Interp = trait(() => ({ buffer: [] as Array<{ t: number; x: number; y: number; z: number; vx: number }> }))`
  — per-remote snapshot buffer (AoS). Local ship does NOT get `Interp`; remotes do NOT get `Sim`.

**State callbacks (in `NetCanvas`, via `getStateCallbacks(room)`):**
- `players.onAdd(p, sid)`: spawn koota entity with `Render`, `Net({sessionId:sid})`. If
  `sid === room.sessionId` → add `Sim` (seed from `p`), `Prev`, `LocalPlayer` (predicted). Else → add
  `Remote`, `Interp`. Keep `Map<sessionId, Entity>`.
- `players.onRemove(_, sid)`: destroy entity + map delete.
- per-player `onChange` (or `.listen`): **local** → run reconcile (below); **remote** → push
  `{ t: performance.now(), x,y,z, vx }` into its `Interp.buffer` (trim to ~1s).

**Prediction + reconciliation (local ship):**
- `app/net/prediction.ts`: pending list `Array<{ seq:number; input:PlayerInput; sent:boolean }>`.
- Local flight tick (fixed step): `const input = { ...currentInput() }` (**value copy** — keyboard.ts
  reuses one object), push `{seq:input.seq, input, sent:false}`, `simulate(sim, input, dt, DEFAULT_TUNING)`.
- 30Hz sender (setInterval): `room.send("input", { inputs: pending.filter(!sent).map(p=>p.input) })`;
  mark sent.
- Reconcile on local snapshot: copy authoritative `PlayerState` fields → local `Sim`; drop pending
  where `seq <= lastProcessedInput`; **replay** remaining via `simulate(sim, p.input, FIXED_DT, DEFAULT_TUNING)`.

**Interpolation (remote ships):** system each render frame: `renderTime = performance.now() - 100`;
for each `Remote, Interp, Render`: find the two buffer samples straddling `renderTime`, lerp x/y/z,
write into `Render` group; `rotation.z` cosmetic bank from interpolated `vx`. If <2 samples, hold at
latest (no extrapolation).

**Render:** make `scene/ship.tsx` query `Render` (all ships) not just `LocalPlayer`, so remotes render.
`syncRenderSystem` writes predicted local `Sim`→`Render`; interp system writes remote→`Render`. Chase
camera follows the `LocalPlayer` `Render` group (reuse `camera/chase.ts`). `NetCanvas` = the one
`useFrame` Loop: `flightSystem`(local predict) → reconcile-pending drain → remote interp → camera.
Track/scenery: reuse S1, seeded from `room.state.seed`.

## Verification the agent must run (report results)
1. `pnpm typecheck` + `pnpm build` green after EACH step.
2. Boot server (`pnpm --filter @slur/server dev` or `pnpm dev`), confirm `[slur] server up`.
3. Smoke: load `/run` in a browser/headless — confirm connect (no console errors), a ship spawns,
   `room.state.players` populates. Two clients → each sees the other move. (Full "feels smooth"
   two-laptop check is the later human gate — not the agent's to sign off.)
4. **Do NOT touch `/solo`.** Report: files changed, any deviations, and what remains for the human gate.

## Out of scope for the agent (do NOT build)
Real track/hazards/finish/collision/bloom (S3); lobby/results/join-by-id/spawn-beside-moving-pack (S4);
combat/rearview (S5); lag compensation, hermite interp, error-blend smoothing, position-history ring
buffer. Keep S1's flat-floor + side-wall `resolveCollisions`.
