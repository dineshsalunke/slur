import type { SimShip } from './types.js';

export function tickStatus( s: SimShip, dt: number ): void {
    if ( s.stunTimer > 0 ) s.stunTimer = Math.max( 0, s.stunTimer - dt );
}
