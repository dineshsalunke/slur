import { CELL, FIXED_DT, type FlightTuning } from '../../constants.js';
import { strafeToward } from '../../pacing/pockets.js';
import { ALL_CLASS_TUNINGS } from '../../ship-classes.js';
import type { GrooveBand } from '../groove/grammar.js';
import type { PlayerInput } from '../input.js';
import { isSettled, SETTLE_HORIZON_TICKS } from '../score/note-move.js';
import { simulate } from '../step.js';
import { spawnShip } from '../types.js';

export const REACTION_S = 0.3;
export const ACT_SPEED: Readonly< Record< GrooveBand, number > > = { low: 1, mid: 0.9, high: 0.75 };

const leadMemo = new Map< string, number >();

export function crossSeconds( t: FlightTuning, dx: number ): number {
    const s = spawnShip( 0, 0 );
    s.vz = t.maxCruise;
    const input: PlayerInput = { seq: 0, throttle: 1, brake: 0, strafe: 0, jump: false };
    let at = -1;
    for ( let n = 0; n < SETTLE_HORIZON_TICKS; n++ ) {
        input.strafe = strafeToward( t, dx - s.x, s.vx );
        simulate( s, input, FIXED_DT, t );
        if ( ! isSettled( s, dx ) ) at = -1;
        else if ( at < 0 ) at = n + 1;
    }
    return at < 0 ? Number.POSITIVE_INFINITY : at * FIXED_DT;
}

export function classLead( t: FlightTuning, act: GrooveBand, dx: number ): number {
    return ACT_SPEED[ act ] * t.maxCruise * ( REACTION_S + crossSeconds( t, Math.abs( dx ) ) ) + 2 * t.halfL;
}

export function leadDistance( act: GrooveBand, dx: number ): number {
    const key = `${ act }:${ Math.abs( dx ) }`;
    let d = leadMemo.get( key );
    if ( d === undefined ) {
        d = Math.ceil( Math.max( ...ALL_CLASS_TUNINGS.map( ( t ) => classLead( t, act, dx ) ) ) / CELL ) * CELL;
        leadMemo.set( key, d );
    }
    return d;
}
