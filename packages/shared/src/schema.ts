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
}

// Room-wide state. `seed` drives deterministic scenery/track on every client (never sync geometry).
export class RunState extends Schema {
    @type( 'uint8' ) phase = 1; // S2 stays running(1); 0=lobby / 2=finished are S4
    @type( 'float32' ) elapsed = 0;
    @type( 'uint32' ) seed = 0; // 0 = "not seeded yet" sentinel; the server sets a real non-zero seed in onCreate. The client loader waits for this to decode (non-zero) before building the track, so client + server never disagree on geometry.
    @type( { map: PlayerState } ) players = new MapSchema< PlayerState >();
}
