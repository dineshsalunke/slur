import { type BounceContact, bounceContact, type FlightTuning, type SimShip } from '@slur/shared';
import { pushHit } from '../scene/hit-events';

const SPARK_LIFT = 0.5;

export function sparkAt( c: BounceContact ): void {
    pushHit( { x: c.x, y: c.y + SPARK_LIFT, z: c.z } );
}

export function sparkIfBounced( s: SimShip, stunBefore: number, vzBefore: number, dt: number, t: FlightTuning ): void {
    const c = bounceContact( s, stunBefore, vzBefore, dt, t );
    if ( c ) sparkAt( c );
}
