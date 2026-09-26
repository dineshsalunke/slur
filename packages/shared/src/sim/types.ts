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

    dead: boolean;
    respawnTimer: number;
    lastSafeX: number;
    lastSafeZ: number;
    finished: boolean;

    stunTimer: number;
    boostTimer: number;
    tugTimer: number;
    slowTimer: number;
    towTimer: number;
    tugAnchorZ: number;
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
        lastSafeX: x,
        lastSafeZ: z,
        finished: false,
        stunTimer: 0,
        boostTimer: 0,
        tugTimer: 0,
        slowTimer: 0,
        towTimer: 0,
        tugAnchorZ: 0,
    };
}

export interface SimWorld {
    broken: Set< number >;
}

export function createSimWorld(): SimWorld {
    return { broken: new Set() };
}

function keyTuple< T >() {
    return < U extends readonly ( keyof T )[] >(
        ...keys: [ keyof T ] extends [ U[ number ] ] ? U : readonly [ 'MISSING key →', Exclude< keyof T, U[ number ] > ]
    ): U => keys as unknown as U;
}

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
    'lastSafeX',
    'lastSafeZ',
    'finished',
    'stunTimer',
    'boostTimer',
    'tugTimer',
    'slowTimer',
    'towTimer',
    'tugAnchorZ',
);

function assignKey< K extends keyof SimShip >( dst: SimShip, src: SimShip, k: K ): void {
    dst[ k ] = src[ k ];
}

export function copySimShip( dst: SimShip, src: SimShip ): void {
    for ( const k of SIM_SHIP_KEYS ) assignKey( dst, src, k );
}

type NumberKey = { [ K in keyof SimShip ]: SimShip[ K ] extends number ? K : never }[ keyof SimShip ];

export const SIM_FLOAT_KEYS = [
    'x',
    'y',
    'z',
    'vx',
    'vy',
    'vz',
    'coyoteTimer',
    'bufferTimer',
    'respawnTimer',
    'lastSafeX',
    'lastSafeZ',
    'stunTimer',
    'boostTimer',
    'tugTimer',
    'slowTimer',
    'towTimer',
    'tugAnchorZ',
] as const satisfies readonly NumberKey[];

export function froundSimShip( ship: SimShip ): void {
    for ( const k of SIM_FLOAT_KEYS ) ship[ k ] = Math.fround( ship[ k ] );
}
