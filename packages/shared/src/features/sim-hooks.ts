import type { FlightTuning } from '../constants.js';
import type { PlayerInput } from '../sim/input.js';
import type { SimShip } from '../sim/types.js';
import type { SimConfig } from '../sim-config.js';
import type { PowerSpec, SimFeature } from './define-sim-feature.js';
import { SIM_FEATURES } from './registry.js';

export function sortFeatures< T extends { readonly id: string } >( features: readonly T[] ): T[] {
    const sorted = [ ...features ].sort( ( a, b ) => ( a.id < b.id ? -1 : a.id > b.id ? 1 : 0 ) );
    sorted.forEach( ( f, i ) => {
        if ( i > 0 && sorted[ i - 1 ]?.id === f.id ) throw new Error( `feature registry: duplicate id "${ f.id }"` );
    } );
    return sorted;
}

const SORTED = sortFeatures< SimFeature >( SIM_FEATURES );
const INPUT = SORTED.flatMap( ( f ) => f.ship?.input ?? [] );
const THRUST = SORTED.flatMap( ( f ) => f.ship?.thrust ?? [] );
const CAP = SORTED.flatMap( ( f ) => f.ship?.cap ?? [] );
const TICK = SORTED.flatMap( ( f ) => f.ship?.tick ?? [] );
const CLEAR = SORTED.flatMap( ( f ) => f.ship?.clear ?? [] );

export const FEATURE_POWERS: readonly PowerSpec[] = SORTED.flatMap( ( f ) => f.power ?? [] );

export function featureInput( s: SimShip, input: PlayerInput, cfg: SimConfig ): PlayerInput {
    let out = input;
    for ( const fold of INPUT ) out = fold( s, out, cfg );
    return out;
}

export function featureThrust( s: SimShip, input: PlayerInput, t: FlightTuning, cfg: SimConfig ): number {
    let sum = 0;
    for ( const thrust of THRUST ) sum += thrust( s, input, t, cfg );
    return sum;
}

export function featureCap( s: SimShip, t: FlightTuning, cap: number, cfg: SimConfig ): number {
    let out = cap;
    for ( const fold of CAP ) out = fold( s, t, out, cfg );
    return out;
}

export function tickFeatures( s: SimShip, t: FlightTuning, dt: number, cfg: SimConfig ): void {
    for ( const tick of TICK ) tick( s, t, dt, cfg );
}

export function clearFeatures( s: SimShip ): void {
    for ( const clear of CLEAR ) clear( s );
}
