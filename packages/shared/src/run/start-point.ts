import { SHIP_ORDER, type ShipId, tuningForShip } from '../ship-classes.js';
import { type RespawnPoint, respawnPoint } from '../sim/respawn-point.js';
import type { Track } from '../sim/space.js';

export type { RespawnPoint };

export function startPointFor( track: Track, shipId: string, x: number, z: number ): RespawnPoint {
    const t = tuningForShip( shipId );
    return respawnPoint( track, x, Math.min( Math.max( z, 0 ), track.finishZ - t.halfL ), t );
}

export function widestShip(): ShipId {
    let best = SHIP_ORDER[ 0 ] as ShipId;
    for ( const id of SHIP_ORDER ) {
        const t = tuningForShip( id );
        const b = tuningForShip( best );
        if ( t.halfW > b.halfW || ( t.halfW === b.halfW && t.halfL > b.halfL ) ) best = id;
    }
    return best;
}
