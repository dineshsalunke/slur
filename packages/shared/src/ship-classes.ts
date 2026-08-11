// Ship taxonomy — server-authoritative, framework-free (NO @colyseus/schema, NO three). Imported by BOTH
// the client (prediction) and the server (authority); both resolve flight tuning from THIS registry by the
// networked shipId, so the movement math is byte-identical — the netcode "one shared simulate()" rule.
//
// TWO LEVELS (a "class" is a GROUP; a "ship" is a variant inside it):
//   • ShipClass — the BALANCE unit. Owns ALL mechanics: a full FlightTuning incl. the AABB footprint
//     (halfW/halfL). Few, carefully balanced. Track-generation fairness floors to the class set.
//   • Ship      — a COSMETIC variant within one class. Owns only { id, name, classId }; inherits its
//     class's mechanics wholesale. Many (and growing). Today each class has exactly ONE ship.
//
// ⇒ Add a ship = a model + a classId (balance inherited, zero tuning). Add a class = a new archetype.
// The wire carries the shipId (a string, set once at join / on hot-swap); the sim resolves shipId → class →
// tuning. Model/scale/visuals live CLIENT-side (apps/client .../ship-visuals.ts), keyed by the SAME id.

import { STUN_SECONDS } from './combat/constants.js';
import { DEFAULT_TUNING, deriveJump, type FlightTuning } from './constants.js';

export type ShipClassId = 'interceptor' | 'fighter' | 'comet' | 'phantom' | 'freighter';
export type ShipId = 'executioner' | 'challenger' | 'bob' | 'dispatcher' | 'imperial';

export interface ShipClass {
    id: ShipClassId;
    name: string;
    tuning: FlightTuning; // the full flight identity — stats + AABB footprint (halfW/halfL) + derived jump
    // Combat identity, BESIDE the flight tuning rather than inside it: FlightTuning is the flight identity,
    // and folding a combat stat in would drag it through DEFAULT_TUNING and every deriveJump spread.
    // Sidegrade, never a free stat — armour is ranked as the exact INVERSE of strafe authority, because a
    // bolt is dodged by weaving. Best weaver ⇒ least armour. A test pins that ordering.
    armour: number; // 0..1 stun resistance — effectiveStun = STUN_SECONDS × (1 − armour).
}

export interface Ship {
    id: ShipId;
    name: string;
    classId: ShipClassId; // the balance group this cosmetic variant belongs to
}

// Per-class flight tunings (the S6 balancing spec — GDD §5.5; tune live at the feel-gate). Fighter IS the
// baseline DEFAULT_TUNING. Each other class spreads the baseline then overrides ONLY its identity fields +
// its own footprint (halfW/halfL, model-derived) and JumpDesign. Jump variance is capped (no sub-3.0 height)
// so the shared track stays gap-fair for every class (see fairness note in track.ts).
export const SHIP_CLASSES: Record< ShipClassId, ShipClass > = {
    interceptor: {
        id: 'interceptor',
        name: 'Interceptor',
        armour: 0, // best weaver (strafeAccel 195) ⇒ no armour. 1.20s stun — the full duration.
        tuning: {
            ...DEFAULT_TUNING,
            maxCruise: 48, // slower top end — pays for its agility
            accel: 45,
            strafeAccel: 210, // best weaver: snappy, high lateral authority (raised 195→210 for crisper flicks)
            strafeClamp: 95,
            strafeDamp: 18, // crispest settle — near-instant stop for precise flicks
            halfW: 1.0, // 2.0u = 0.50 cell (executioner model)
            halfL: 0.92, // 1.84u = 0.46 cell — short ⇒ twitchy at gaps
            ...deriveJump( { height: 3.0, apexTime: 0.3, descentTime: 0.24, doubleHeight: 3.6, minHeight: 0.8 } ),
            maxJumps: 2,
        },
    },
    fighter: {
        id: 'fighter',
        name: 'Fighter',
        armour: 0.2, // the all-rounder baseline (strafeAccel 150) ⇒ 0.96s stun.
        // The baseline: DEFAULT_TUNING already carries Fighter stats + footprint (halfW 1.3 / halfL 1.26) + jump.
        tuning: DEFAULT_TUNING,
    },
    comet: {
        id: 'comet',
        name: 'Comet',
        armour: 0.1, // 2nd-best weaver (165) ⇒ 1.08s stun. The glass rocket pays for its speed.
        tuning: {
            ...DEFAULT_TUNING,
            maxCruise: 70, // fastest — the glass rocket
            accel: 52,
            strafeAccel: 180,
            strafeClamp: 85,
            strafeDamp: 9, // still the draftiest (skill ceiling) but far less floaty than 4 — flicks now land crisply
            halfW: 1.1, // 2.2u = 0.55 cell (bob model)
            halfL: 0.59, // 1.18u = 0.29 cell — tiny ⇒ weak at gaps (offset by raw speed)
            ...deriveJump( { height: 2.8, apexTime: 0.3, descentTime: 0.24, doubleHeight: 3.3, minHeight: 0.8 } ),
            maxJumps: 2,
        },
    },
    phantom: {
        id: 'phantom',
        name: 'Phantom',
        armour: 0.3, // clumsier weaver (135) ⇒ 0.84s stun. Tanks a hit like it tanks a gap.
        tuning: {
            ...DEFAULT_TUNING,
            maxCruise: 50,
            accel: 38,
            strafeAccel: 150, // clumsier weaver (still 4th of 5)
            strafeClamp: 75,
            strafeDamp: 13, // crisper settle for clean flicks
            halfW: 1.2, // 2.4u = 0.60 cell (dispatcher model)
            halfL: 2.51, // 5.02u = 1.26 cell — long ⇒ tanks gaps
            ...deriveJump( { height: 4.2, apexTime: 0.32, descentTime: 0.26, doubleHeight: 5.0, minHeight: 0.9 } ),
            maxJumps: 3, // triple-jump — the air / gap master
        },
    },
    freighter: {
        id: 'freighter',
        name: 'Freighter',
        armour: 0.4, // worst weaver (105) ⇒ 0.72s stun, the shortest. Sluggish, so it eats hits instead.
        tuning: {
            ...DEFAULT_TUNING,
            maxCruise: 62, // carries momentum
            accel: 30, // slow to spool up
            strafeAccel: 118, // worst weaver: still the sluggish floor (sets the weave CURV_CAP), but responsive enough to flick
            strafeClamp: 65,
            strafeDamp: 10, // crisper than 5 so even the heavy ship's flicks land instead of drifting
            halfW: 1.25, // 2.5u = 0.62 cell (imperial CAPPED for size — feel-gate 2026-08-09). Weave penalty is
            //             its sluggish strafe (105/65), NOT a huge hitbox, so the footprint can stay moderate.
            halfL: 3.0, // 6.0u = 1.5 cell — still the LONGEST ⇒ gap-tank, but no longer oppressively big.
            ...deriveJump( { height: 3.6, apexTime: 0.3, descentTime: 0.24, doubleHeight: 4.3, minHeight: 0.9 } ),
            maxJumps: 2,
        },
    },
};

// The ships (cosmetic variants). Today: one per class — each ship's measured model box IS its class's
// footprint (see the halfW/halfL above). Add a variant by adding a row here + a model + a visuals entry.
export const SHIPS: Record< ShipId, Ship > = {
    executioner: { id: 'executioner', name: 'Executioner', classId: 'interceptor' },
    challenger: { id: 'challenger', name: 'Challenger', classId: 'fighter' },
    bob: { id: 'bob', name: 'Bob', classId: 'comet' },
    dispatcher: { id: 'dispatcher', name: 'Dispatcher', classId: 'phantom' },
    imperial: { id: 'imperial', name: 'Imperial', classId: 'freighter' },
};

// Default ship = the Fighter-class variant (the neutral all-rounder new players / unset wire values get).
export const DEFAULT_SHIP: ShipId = 'challenger';

// Client → server "I want this ship" message (dev hot-swap keys 1..5; real pick-screen is later). The
// server validates the id against SHIPS and sets the authoritative PlayerState.shipId — never client-owned.
export const SET_CLASS_MESSAGE = 'setClass';

// True iff `id` is a known ship — the server's guard before trusting a setClass payload.
export function isShipId( id: unknown ): id is ShipId {
    return typeof id === 'string' && id in SHIPS;
}

// Ordered ship list — the stable index used by the dev hot-swap keys 1..5 (client sends the id, not the
// index, so reordering this never desyncs the wire; it only reshuffles which key maps to which ship).
export const SHIP_ORDER: ShipId[] = [ 'executioner', 'challenger', 'bob', 'dispatcher', 'imperial' ];

// Resolve a (possibly unknown / stale / empty) shipId to its ship, class, and flight tuning. Falls back to
// the default ship so a bad wire value can NEVER crash the sim (server or client replay).
export function shipOf( id: string ): Ship {
    return SHIPS[ id as ShipId ] ?? SHIPS[ DEFAULT_SHIP ];
}
export function classOfShip( id: string ): ShipClass {
    return SHIP_CLASSES[ shipOf( id ).classId ];
}
export function tuningForShip( id: string ): FlightTuning {
    return classOfShip( id ).tuning;
}
export function armourForShip( id: string ): number {
    return classOfShip( id ).armour;
}

// How long a bolt hit freezes THIS ship. The server is the only writer of stunTimer (run-room.ts); the
// client receives the value and decays it in simulate(), so it never computes a duration of its own.
export function stunDurationForShip( id: string ): number {
    return STUN_SECONDS * ( 1 - armourForShip( id ) );
}

// Every class tuning — for track-generation fairness (hazards are floored to the LEAST-capable class so the
// one shared server track is passable by all; see MAX_GAP / min-corridor derivation in track.ts).
export const ALL_CLASS_TUNINGS: FlightTuning[] = Object.values( SHIP_CLASSES ).map( ( c ) => c.tuning );
