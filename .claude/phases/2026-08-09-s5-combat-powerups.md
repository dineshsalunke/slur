# S5 — Combat & power-ups (the "mess with your friends" payload)

Arc phase note. Keystone: **BC1** (server-sim dynamic entities). GDD §5.3–5.7 is the design source;
this note is the slice we actually carve + build.

---

## Ideate — LOCKED (2026-08-09)

**Goal (altitude):** turn a working race loop into SLUR — *messing with your friends*. The whole Mess
half hangs off **BC1**, which is a *pipeline* not a feature: `spawn → sim → interp → hit-detect →
status-effect → VFX → HUD`. Once the pipe exists, weapons are cheap content (§5.7 "one at a time").

**North-star hero moment:**
> You're threading a cube field. A rival behind you fires a **Bolt** → you're **stunned** → you clip a
> cube → *derezz* → they blow past.

Combat (BC1) + status verb (BC2 stun) + **the track does the killing** (§5.4 lock: disruption, not
instant death). Exercises the whole pipe end-to-end.

**Success bar: (A) thin vertical** — prove the pipe with ONE weapon, feel-gate the combat loop, *then*
fan out content. (Rejected (B) starter-trinity: don't build the pipe AND four mechanics before the first
feel-gate.)

**The v1 slice:**

| Piece | v1 pick | Rationale |
|---|---|---|
| BC1 entity | **Bolt** — dumb forward projectile (+z, AABB band vs ships ahead) | Straight ribbon ⇒ forward-fire needs no BC8 auto-lock. Hero verb, minimal machinery. |
| Effect (BC2) | **stun** (brief input-freeze) | §5.4 disruption-not-death; ships don't rotate (straight ribbon) so spin has no heading yet. Lethal *via track*. |
| Acquire | **track-placed pickups** (deterministic from seed), **single held slot**, `E`/`usePowerUp` to use | Fits "everything derives from the seed"; single slot keeps HUD + decisions clean. |
| Awareness | **threat-warning HUD** ("⚠ incoming/rear") — DOM overlay, net-debug-hud pattern | DECIDED 2026-08-09 over rearview mirror. Mirror = 2nd render pass + bypasses global Bloom + 12-ship perf; its real value arrives with mines/homing. |
| Opening move | extract room→world bridge (`net-canvas.tsx` effect) → `net/` module | Projectile reconcile lands there; also clears the pre-existing `net-canvas:113` complexity lint. See [[s5-opens-with-bridge-extraction]]. |

**Deferred fast-follows (post-v1, on top of a proven pipe):** Mine (drop-behind), Shield, Boost pickup,
auto-lock-nearest (BC8), the **RenderTexture rearview mirror** (rides with mines/homing).

---

## Brainstorm — BC1 networked shape — RESOLVED (2026-08-09)

Grounded in netcode.md / colyseus.md (source-verified acceptance criteria):
- **Projectiles = interp-only** (never predicted). Client shows cosmetic muzzle flash; server owns the real
  projectile + hits. (netcode.md:172,189)
- **Projectiles live in `MapSchema<Projectile>` on RunState, actively pruned** on hit/expire. (colyseus.md:180,158)
- **Stepped server-side in `stepWorld()`** inside the fixed step, separate from per-ship `simulate()`. (netcode.md:121)
  Step + hit-test as a **pure, headlessly-tested** fn in `@slur/shared` (server-only caller) — matches sim/director discipline. *(user-agreed)*
- **`heldPower` (uint8) + stun = small fields on PlayerState**, not event arrays. (colyseus.md:180)
- **`stunTimer` IS a SimShip field** — the local ship is predicted, so `simulate()` must read stun to freeze
  control during replay ⇒ trips the new `SIM_SHIP_KEYS` guard (its first real customer). `heldPower` is
  schema-only (sim never reads it) ⇒ NOT a SimShip field.
- **Fire = discrete reliable message** (`USE_POWERUP_MESSAGE`), not the input axis. (colyseus.md:145,177)
  NB: `usePowerUp` is already a (held-boolean) field in PlayerInput + KeyE — REMOVE it (would machine-gun);
  route fire via a keydown→room.send that ignores `e.repeat` (the keys-1–5 hot-swap pattern).
- **Pickups:** deterministic layout from seed (both ends compute; geometry never synced, netcode.md:155);
  only per-slot **availability** syncs. **Short respawn** (~5s). Grab-on-overlap grants `heldPower`. *(user-agreed)*
- **Stun mechanic:** while `stunTimer>0`, feed `simulate()` a NEUTRAL input (coast + drift, physics/collision
  still run) and decrement `stunTimer`. §5.4 disruption-not-death — the track does the killing. Predicted.

## Prep — concrete diff-shape + commit boundaries (DRAFT for Align)

**Commit boundaries** (each independently green: typecheck + tests + biome):

- **C1 — Opening move (pure refactor, zero behavior change).** Extract the Colyseus→ECS reconcile+timer out
  of the `NetCanvas` `useEffect` (net-canvas.tsx:88–155) into `apps/client/app/net/attach-room-to-world.ts`
  (`attachRoomToWorld(room, world, predictor, trackRef): () => void`, mirroring `attachLobbyStore`). Effect
  body becomes `useEffect(() => attachRoomToWorld(...), [room, predictor])`. Also clears the pre-existing
  `net-canvas:113` cognitive-complexity lint. See [[s5-opens-with-bridge-extraction]].

- **C2 — Shared combat foundations (pure + headlessly tested).**
  - `SimShip += stunTimer` → add to interface + `SIM_SHIP_KEYS` + `spawnShip` (guard forces all three) +
    `simulate()` stun branch (NEUTRAL input while stunned).
  - New `@slur/shared/combat/` (colocated messages + consts): `USE_POWERUP_MESSAGE`; `BOLT_SPEED/BOLT_TTL/
    BOLT_HALF`, `STUN_SECONDS`, `PICKUP_RESPAWN_S`; `HeldPower` enum (0 none / 1 bolt).
  - `ProjectileState` interface + `stepProjectiles()` (advance z, decrement ttl, prune) + `boltHits()` AABB
    (owner-immune, lateral+z band vs ship footprint, generous y for v1); `pickupLayout(seed)` (deterministic)
    + `grabPickup()` overlap test.
  - Schema **appends (wire-order!):** `PlayerState` += `@type('float32') stunTimer`, `@type('uint8') heldPower`
    (after `spectating`); new `class Projectile extends Schema { x,y,z:float32; ownerId:string; ttl:float32 }`;
    `RunState` += `@type({map:Projectile}) projectiles`, `@type({map:'boolean'}) pickupTaken` (after finishDeadline).
  - Tests (step.test/new combat.test): stun zeroes control + decrements; stepProjectiles advance+prune;
    boltHits owner-immune + band hit/miss; pickup grab/respawn.

- **C3 — Server authority (run-room).** `stepWorld(dt)` in the racing branch: advance projectiles (shared),
  resolve `boltHits` → victim `stunTimer=STUN_SECONDS` + prune + `broadcast('hit', {x,y,z,victimId})`;
  pickup grab (→ `heldPower`) + respawn timers (server-plain Map). `onMessage(USE_POWERUP_MESSAGE)`: validate
  racing + !spectating + !dead + `stunTimer<=0` + `heldPower!=0` → spawn Projectile from authoritative pose,
  clear `heldPower`.

- **C4 — Client combat views.** In the C1 bridge module: projectile onAdd/onChange/onRemove → ECS projectile
  entities (interp buffer, reuse Snapshot pattern). Instanced projectile render + instanced pickups
  (hide `pickupTaken`). `heldPower` HUD chip + **threat-warning HUD** (DOM, net-debug-hud pattern, reads
  `projectiles`+local pos → directional ⚠). `KeyE` keydown(!repeat)→`room.send(USE_POWERUP_MESSAGE)`;
  cosmetic hit-spark on the `hit` message. Remove reserved `usePowerUp` from PlayerInput/emptyInput/keyboard.
  (May split C4a projectiles+pickups+fire / C4b HUDs+FX.)

**Risks / knowingly-accepted trade-offs:**
1. Schema wire-order — strictly append-only (pre-launch clean-rebuild condition holds; both ends rebuild from
   the shared package). New fields default-safe.
2. One small client correction at the hit tick (stun arrives by snapshot; can't predict the hit) — accepted,
   it's netcode.md's "collision the client didn't predict → smooth resolve" case.
3. C1 touches the S2-sensitive room lifecycle — but it's behavior-identical code-motion; the room stays
   loader-owned, only the effect BODY moves to a module fn. Verify two-tab still races before C2.
4. Projectile y-overlap generous for v1 (bolts at shooter y) — refine if it feels off at the feel-gate.

---

## Reconcile — S5 combat CLOSED (2026-08-10; human gate passed)

**Planned vs built** — the thin-vertical slice landed as designed, C1→C4c, each commit reviewed + green:
- C1 `9538e0e` bridge extraction · C2 `027116b` shared foundations (stun/projectiles/pickups; the `SIM_SHIP_KEYS`
  guard tripped on a stale test fixture — working as designed) · C3 `4c41a46` server authority · C4a `6d20b99`
  client views · C4b `87567cb` hit-spark + stun cue · C4c `fd6bdb3` threat HUD. Feel-gate tuning + dev-HUD
  readout `a310b92`.
- **Deviations from Prep (all caught in review/playtest, all improvements):** fire-feedback split C4b(spark+stun
  cue)/C4c(threat HUD); the on-ship **stun-flicker** was added beyond Prep's spark-only scope after the playtest
  showed a landed hit was invisible — victim ship now strobes off predicted `Sim.stunTimer` (local) / a new
  snapshot `stunned` flag carried like `dead` (remote); pickup placement made **hazard-aware** (plain segments
  only); race-boundary **`clearCombat`** added (stale bolts/held/pickups were leaking across rounds).

**Debugging note (instrument-first win):** "bolt fires but doesn't affect the ship" was NOT a hit-detection bug —
it was zero hit feedback. Surfacing authoritative `stunTimer` as `st=` in the dev HUD isolated server-hit
(working) from client-visual (missing). See [[instrument-dont-theorize]].

**Human gate:** passed 2026-08-10 — two-tab, fire → bolt → hit → spark + stun-flicker on both clients.
Functionality locked; visuals polish deferred.

**Deferred:** auto-lock (BC8) · rearview mirror · Mine/Shield/Boost pickups · wider `BOLT_HALF`/aim-assist if aim
feels fussy · combat visuals polish · **hardening**: per-bolt `onChange` detach, `@colyseus/testing` room test,
`overlays.css` maxLines.
