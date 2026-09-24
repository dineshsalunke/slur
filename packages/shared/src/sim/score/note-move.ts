import { CELL, DEFAULT_TUNING, FIXED_DT, type FlightTuning, TRACK_CONTRACT } from '../../constants.js';
import { airDistance } from '../../pacing/jump-window.js';
import type { PlayerInput } from '../input.js';
import { simulate } from '../step.js';
import { type SimShip, spawnShip } from '../types.js';

export const CONTRACT_TUNING: FlightTuning = {
    ...DEFAULT_TUNING,
    strafeAccel: TRACK_CONTRACT.weaveStrafeAccel,
    strafeClamp: TRACK_CONTRACT.weaveStrafeClamp,
    maxCruise: TRACK_CONTRACT.registerCruise,
};

export const SETTLE_X_TOL = 0.25;
export const SETTLE_V_TOL = 1;
export const SETTLE_HORIZON_TICKS = 240;
export const MAX_HOLD_TICKS = 90;
export const MAX_REVERSE_TICKS = 60;
export const HELD_NOTE_CELLS = 3;

export interface StrafePlan {
    hold: number;
    reverse: number;
    ticks: number;
}

export interface NoteMoves {
    step1: number;
    step2: number;
    held: number;
    jump: number;
    double: number;
}

export function strafeInput( plan: StrafePlan, dir: number, tick: number, input: PlayerInput ): void {
    if ( tick < plan.hold ) input.strafe = dir;
    else if ( tick < plan.hold + plan.reverse ) input.strafe = -dir;
    else input.strafe = 0;
}

export function isSettled( s: SimShip, x: number ): boolean {
    return Math.abs( s.x - x ) <= SETTLE_X_TOL && Math.abs( s.vx ) <= SETTLE_V_TOL;
}

function settleTicks( t: FlightTuning, dx: number, hold: number, reverse: number ): number {
    const s = spawnShip( 0, 0 );
    s.vz = t.maxCruise;
    const input: PlayerInput = { seq: 0, throttle: 1, brake: 0, strafe: 0, jump: false };
    const plan = { hold, reverse, ticks: 0 };
    let at = -1;
    for ( let n = 0; n < SETTLE_HORIZON_TICKS; n++ ) {
        strafeInput( plan, 1, n, input );
        simulate( s, input, FIXED_DT, t );
        if ( ! isSettled( s, dx ) ) at = -1;
        else if ( at < 0 ) at = n + 1;
    }
    return at;
}

export function strafePlan( t: FlightTuning, dx: number ): StrafePlan | null {
    let best: StrafePlan | null = null;
    for ( let hold = 1; hold < MAX_HOLD_TICKS; hold++ ) {
        if ( best !== null && hold >= best.ticks ) break;
        for ( let reverse = 0; reverse < MAX_REVERSE_TICKS; reverse++ ) {
            const ticks = settleTicks( t, dx, hold, reverse );
            if ( ticks > 0 && ( best === null || ticks < best.ticks ) ) best = { hold, reverse, ticks };
        }
    }
    return best;
}

function settleSeconds( t: FlightTuning, cells: number ): number {
    const plan = strafePlan( t, cells * CELL );
    return plan === null ? Number.POSITIVE_INFINITY : plan.ticks * FIXED_DT;
}

export function measureNoteMoves( t: FlightTuning ): NoteMoves {
    return {
        step1: settleSeconds( t, 1 ),
        step2: settleSeconds( t, 2 ),
        held: settleSeconds( t, HELD_NOTE_CELLS ),
        jump: airDistance( t, 'single' ) / t.maxCruise,
        double: airDistance( t, 'double' ) / t.maxCruise,
    };
}

export const NOTE_MOVE_S: Readonly< NoteMoves > = Object.freeze( measureNoteMoves( CONTRACT_TUNING ) );

const unplayable = Object.entries( NOTE_MOVE_S ).filter( ( [ , v ] ) => ! Number.isFinite( v ) || v <= 0 );
if ( unplayable.length > 0 )
    throw new Error( `the contract ship cannot play: ${ unplayable.map( ( [ k ] ) => k ).join( ', ' ) }` );
