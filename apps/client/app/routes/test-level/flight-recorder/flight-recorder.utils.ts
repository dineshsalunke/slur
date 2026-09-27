import { HeldPower, type SimShip } from '@slur/shared';
import { SPEED_BANDS, TELEPORT_U } from './flight-recorder.constants';

export type FlightEventKind = 'bump' | 'death' | 'takeoff' | 'landing' | 'pickup' | 'boost';

export interface FlightEvent {
    kind: FlightEventKind;
    x: number;
    z: number;
}

export interface FlightPoint {
    x: number;
    z: number;
    band: number;
}

export interface FlightTake {
    id: number;
    ticks: number;
    runs: FlightPoint[][];
    events: FlightEvent[];
}

export interface FlightSnap {
    x: number;
    z: number;
    dead: boolean;
    grounded: boolean;
    jumpsUsed: number;
    boosting: boolean;
    held: number;
}

export function snapOf( s: SimShip, slots: ArrayLike< number > ): FlightSnap {
    let held = 0;
    for ( let i = 0; i < slots.length; i++ ) if ( slots[ i ] !== HeldPower.none ) held++;
    return {
        x: s.x,
        z: s.z,
        dead: s.dead,
        grounded: s.grounded,
        jumpsUsed: s.jumpsUsed,
        boosting: s.boostTimer > 0,
        held,
    };
}

export function eventsBetween( prev: FlightSnap, next: FlightSnap ): FlightEventKind[] {
    if ( next.dead ) return prev.dead ? [] : [ 'death' ];
    if ( prev.dead ) return [];
    const out: FlightEventKind[] = [];
    if ( next.jumpsUsed > prev.jumpsUsed ) out.push( 'takeoff' );
    if ( ! prev.grounded && next.grounded ) out.push( 'landing' );
    if ( ! prev.boosting && next.boosting ) out.push( 'boost' );
    if ( next.held > prev.held ) out.push( 'pickup' );
    return out;
}

export function breaksRun( prev: FlightSnap | null, next: FlightSnap ): boolean {
    return prev === null || prev.dead || Math.hypot( next.x - prev.x, next.z - prev.z ) > TELEPORT_U;
}

export function speedBand( vz: number, maxCruise: number ): number {
    if ( vz > maxCruise ) return SPEED_BANDS;
    return Math.min( SPEED_BANDS - 1, Math.max( 0, Math.floor( ( vz / maxCruise ) * SPEED_BANDS ) ) );
}

export function emptyTake( id: number ): FlightTake {
    return { id, ticks: 0, runs: [], events: [] };
}

export function pushPoint( take: FlightTake, point: FlightPoint, newRun: boolean ): void {
    const run = take.runs.at( -1 );
    if ( newRun || run === undefined ) take.runs.push( [ point ] );
    else run.push( point );
}

export function countOf( take: FlightTake, kind: FlightEventKind ): number {
    return take.events.filter( ( e ) => e.kind === kind ).length;
}

export function clockOf( seconds: number ): string {
    return `${ Math.floor( seconds / 60 ) }:${ String( seconds % 60 ).padStart( 2, '0' ) }`;
}
