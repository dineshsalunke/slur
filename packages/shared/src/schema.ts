// S2 wire contract — the ONLY file in @slur/shared that imports @colyseus/schema.
// The sim (sim/*.ts) stays framework-free; PlayerState `implements SimShip` is the compile-time
// guard that the schema still structurally satisfies the sim, so the server runs simulate()
// DIRECTLY on the schema instance (mutations auto-generate deltas).
//
// ⚠ FOOTGUN — @type declaration order IS the wire format. APPEND ONLY, never reorder or insert;
//   the encoder/decoder index fields by declaration order and a mismatch silently corrupts decoding.
//   Mark dead fields @deprecated() rather than removing them — UNLESS client + server are rebuilt
//   atomically from this package with no old peers live (true in LAN dev, pre-launch). Under that
//   condition a clean removal is safe: both ends re-derive identical indices. (`energy` was removed
//   this way when boost became a pickup — S5 — rather than left as dead wire state.)
//
// `type` is the field DECORATOR — a VALUE import, NOT `import type` (verbatimModuleSyntax is on).

import { MapSchema, Schema, type } from '@colyseus/schema';
import type { ProjectileState } from './combat/projectiles.js';
import { DEFAULT_SHIP } from './ship-classes.js';
import type { SimShip } from './sim/types.js';

export const ROOM_NAME = 'run';

// One networked ship. Declares every SimShip field so simulate() mutates it in place, plus two
// netcode-bookkeeping fields the sim ignores.
export class PlayerState extends Schema implements SimShip {
    // ── SimShip: position + velocity (float32 — rendering precision, not authoritative thresholds) ──
    @type( 'float32' ) x = 0;
    @type( 'float32' ) y = 0;
    @type( 'float32' ) z = 0;
    @type( 'float32' ) vx = 0;
    @type( 'float32' ) vy = 0;
    @type( 'float32' ) vz = 0;

    // ── SimShip: transient jump state — MUST sync so the client's local replay re-predicts jumps
    //    identically (omitting these mispredicts jumps — see brainstorm "two reconciliations"). ──
    @type( 'boolean' ) grounded = true;
    @type( 'uint8' ) jumpsUsed = 0;
    @type( 'boolean' ) jumpHeld = false;
    @type( 'float32' ) coyoteTimer = 0;
    @type( 'float32' ) bufferTimer = 0;

    // ── Netcode bookkeeping (NOT part of SimShip) ──
    @type( 'uint32' ) lastProcessedInput = 0; // seq of the last input the server consumed for this player → client drops acked pending inputs, replays the rest
    @type( 'boolean' ) connected = true; // false while dropped (reconnection window open) → peers ghost the ship

    // ── S3 track/collision state — APPENDED after `connected` (declaration order = wire format). These
    //    mirror the new SimShip fields in the SAME order so simulate() mutates them in place. ──
    @type( 'boolean' ) dead = false;
    @type( 'float32' ) respawnTimer = 0;
    @type( 'float32' ) invulnTimer = 0;
    @type( 'float32' ) lastSafeX = 0;
    @type( 'float32' ) lastSafeZ = 0;
    @type( 'boolean' ) finished = false;
    @type( 'float32' ) finishTime = 0; // server-stamped elapsed at finish; extra beyond SimShip (structural match allows extras)

    // ── Ship identity (netcode bookkeeping; NOT a SimShip field). APPEND-ONLY (declaration order = wire).
    //    A string (not a uint8 index) so adding classes/ships never remaps existing values. The server owns
    //    it (set on join, updated by the `setClass` message); BOTH ends resolve shipId → class → FlightTuning
    //    via ship-classes.ts so the shared simulate() runs identical math. ──
    @type( 'string' ) shipId = DEFAULT_SHIP;

    // ── S4 session/identity — APPENDED after `shipId` (declaration order = wire format). ──
    @type( 'string' ) name = ''; // display name (join option); shown in the lobby list + standings
    @type( 'uint8' ) colorId = 0; // team-colour palette index (see COLOR_COUNT); cosmetic, synced so peers tint the ship
    @type( 'boolean' ) spectating = false; // joined mid-round under the Race lock → NOT simulated; watches, races next round

    // ── S5 combat — APPENDED after `spectating` (declaration order = wire format). ──
    @type( 'float32' ) stunTimer = 0; // SimShip field: seconds of input-freeze remaining after a bolt hit (mirrors SimShip.stunTimer)
    @type( 'uint8' ) heldPower = 0; // held power-up slot (HeldPower: 0 none / 1 bolt). NOT a SimShip field — the sim never reads it; schema-only.
}

// S5 combat — a live bolt. Server-owned + interp-only on the client (never predicted). Structurally
// satisfies ProjectileState (combat/projectiles.ts) so the shared stepProjectiles/boltHits mutate it
// directly server-side. Pruned from RunState.projectiles on hit/expire.
export class Projectile extends Schema implements ProjectileState {
    @type( 'float32' ) x = 0;
    @type( 'float32' ) y = 0;
    @type( 'float32' ) z = 0;
    @type( 'string' ) ownerId = ''; // sessionId of the firer — owner-immune in boltHits
    @type( 'float32' ) ttl = 0; // seconds remaining before expiry; server prunes at <= 0
}

// Room-wide state. `seed` drives deterministic scenery/track on every client (never sync geometry).
export class RunState extends Schema {
    // S4 4-phase lifecycle (see race/director.ts PHASE): 0=lobby · 1=countdown · 2=racing · 3=finished.
    // Default is lobby now (S2's default of 1 meant "running"; the enum was reassigned pre-launch).
    @type( 'uint8' ) phase = 0;
    @type( 'float32' ) elapsed = 0; // RACE clock: reset to 0 at GO, advanced ONLY during racing → finishTime/deadline are race-relative
    @type( 'uint32' ) seed = 0; // 0 = "not seeded yet" sentinel; the server sets a real non-zero seed in onCreate. The client loader waits for this to decode (non-zero) before building the track, so client + server never disagree on geometry.
    @type( { map: PlayerState } ) players = new MapSchema< PlayerState >();

    // ── S4 session lifecycle — APPENDED after `players` (declaration order = wire format). ──
    @type( 'string' ) hostId = ''; // sessionId of the host (first joiner; reassigned on host leave). Only the host may start/restart.
    @type( 'float32' ) countdown = 0; // >0 only during phase 1 (countdown); client renders ceil(). Ships + picks frozen the whole time.
    @type( 'float32' ) finishDeadline = 0; // 0 until the first finisher; then elapsed+GRACE — the race ends when the clock passes it.

    // ── S5 combat — APPENDED after `finishDeadline` (declaration order = wire format). ──
    @type( { map: Projectile } ) projectiles = new MapSchema< Projectile >(); // live bolts, keyed by id; server prunes on hit/expire
    // Pickup availability, keyed by pickupLayout() slot id. Semantics: present && true = currently taken (hidden);
    // absent (or false) = available. Only availability syncs — positions derive from the seed on both ends.
    @type( { map: 'boolean' } ) pickupTaken = new MapSchema< boolean >();
}
