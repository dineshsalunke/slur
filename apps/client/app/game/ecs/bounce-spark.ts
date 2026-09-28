import { type BounceContact, bounceContact, type Contact, type FlightTuning, type SimShip } from '@slur/shared';
import { pushHit } from '../scene/hit-events';

const SPARK_LIFT = 0.5;

export function sparkAt( c: BounceContact ): void {
    pushHit( { x: c.x, y: c.y + SPARK_LIFT, z: c.z } );
}

export function sparkIfBounced( s: SimShip, contact: Contact, t: FlightTuning ): void {
    const c = bounceContact( s, contact, t );
    if ( c ) sparkAt( c );
}
