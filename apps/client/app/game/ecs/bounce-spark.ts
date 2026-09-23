import type { FlightTuning, SimShip } from '@slur/shared';
import { pushHit } from '../scene/hit-events';

const SPARK_LIFT = 0.5;

export function sparkIfBounced( s: SimShip, stunBefore: number, vzBefore: number, dt: number, t: FlightTuning ): void {
    if ( s.dead || s.stunTimer <= Math.max( 0, stunBefore - dt ) + 1e-6 ) return;
    const zFace = vzBefore !== 0 && Math.sign( s.vz ) !== Math.sign( vzBefore );
    pushHit( {
        x: zFace ? s.x : s.x - Math.sign( s.vx ) * t.halfW,
        y: s.y + SPARK_LIFT,
        z: zFace ? s.z - Math.sign( s.vz ) * t.halfL : s.z,
    } );
}
