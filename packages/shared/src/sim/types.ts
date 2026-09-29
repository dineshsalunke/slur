import type { PortalState } from '../combat/portal.js';
import { SIM_FLOAT_KEYS, SIM_SHIP_KEYS, type SimShipFields } from '../player-fields.js';

export { SIM_FLOAT_KEYS, SIM_SHIP_KEYS };

export type SimShip = SimShipFields;

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
        glideTimer: 0,
        tugTimer: 0,
        slowTimer: 0,
        towTimer: 0,
        tugAnchorZ: 0,
        portalHops: 0,
        strafeHeld: 0,
        kickLeft: 0,
        kicking: false,
    };
}

export interface SimWorld {
    broken: Set< number >;
    portals: Map< string, PortalState >;
}

export function createSimWorld(): SimWorld {
    return { broken: new Set(), portals: new Map() };
}

function assignKey< K extends keyof SimShip >( dst: SimShip, src: SimShip, k: K ): void {
    dst[ k ] = src[ k ];
}

export function copySimShip( dst: SimShip, src: SimShip ): void {
    for ( const k of SIM_SHIP_KEYS ) assignKey( dst, src, k );
}

export function froundSimShip( ship: SimShip ): void {
    for ( const k of SIM_FLOAT_KEYS ) ship[ k ] = Math.fround( ship[ k ] );
}
