// SimShip — the plain, framework-free simulation state. In S2 the Colyseus PlayerState schema
// declares these SAME fields, so a Schema instance structurally satisfies SimShip → identical
// sim server-side, zero rework. Keep field names EXACTLY as-is. Banking is render-only (from vx),
// deliberately NOT a sim field.

export interface SimShip {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    grounded: boolean;
    jumpsUsed: number;
    jumpHeld: boolean;
    coyoteTimer: number;
    bufferTimer: number;

    // ── S3 track/collision state (appended; the PlayerState schema mirrors these in the SAME order) ──
    dead: boolean; // true while derezzed & waiting to respawn; sim is frozen (velocity zeroed) this whole time
    respawnTimer: number; // seconds remaining until respawn while dead (counts down each step)
    invulnTimer: number; // seconds of post-respawn grace where block-death is ignored (falling still kills)
    lastSafeX: number; // last grounded lateral position — the respawn anchor (updated every landing)
    lastSafeZ: number; // last grounded forward position — the respawn anchor
    finished: boolean; // crossed the finish gate (z >= finishZ); latched once true
}

export function spawnShip( x = 0, z = 0 ): SimShip {
    return {
        x,
        y: 0,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        grounded: true,
        jumpsUsed: 0,
        jumpHeld: false,
        coyoteTimer: 0,
        bufferTimer: 0,
        dead: false,
        respawnTimer: 0,
        invulnTimer: 0,
        lastSafeX: x, // spawn is on safe ground, so it IS the first safe anchor
        lastSafeZ: z,
        finished: false,
    };
}

// ── Exhaustive copy machinery (S5 guard) ─────────────────────────────────────────────────────────
// SimShip is snapshot-copied (client prediction) and reset (race start) in more than one place. Hand-
// enumerating the fields at each site is a SILENT-bug risk: a new field (e.g. S5 combat hp / effect
// timers) that a copier forgets compiles clean, then mispredicts every tick with no test failure. So we
// drive all copying off ONE key list the type system forces to stay exhaustive.

// keyTuple<T>()(...keys) — a runtime tuple the compiler REQUIRES to list every key of T. Omit one and the
// call fails to type-check (the rest-param type demands the whole keyof-union). THIS is the guard.
function keyTuple< T >() {
    return < U extends readonly ( keyof T )[] >(
        ...keys: [ keyof T ] extends [ U[ number ] ] ? U : readonly [ 'MISSING key →', Exclude< keyof T, U[ number ] > ]
    ): U => keys as unknown as U;
}

// Every SimShip field, once. Add a field to SimShip → this list stops compiling until it's added here,
// after which every copier below picks it up for free.
export const SIM_SHIP_KEYS = keyTuple< SimShip >()(
    'x',
    'y',
    'z',
    'vx',
    'vy',
    'vz',
    'grounded',
    'jumpsUsed',
    'jumpHeld',
    'coyoteTimer',
    'bufferTimer',
    'dead',
    'respawnTimer',
    'invulnTimer',
    'lastSafeX',
    'lastSafeZ',
    'finished',
);

// Per-key assignment. The generic pins dst[k] and src[k] to the SAME key so the write type-checks (a bare
// dst[k] = src[k] over a union key does not). Works on a plain object AND a Colyseus schema instance —
// each @type field's setter fires per key, exactly as a hand-written `p.x = …` would (so deltas track).
function assignKey< K extends keyof SimShip >( dst: SimShip, src: SimShip, k: K ): void {
    dst[ k ] = src[ k ];
}

// Copy every SimShip field src → dst. Exhaustive by construction (iterates SIM_SHIP_KEYS). Schema-only
// extras (finishTime, netcode bookkeeping) are deliberately untouched — callers own those.
export function copySimShip( dst: SimShip, src: SimShip ): void {
    for ( const k of SIM_SHIP_KEYS ) assignKey( dst, src, k );
}
