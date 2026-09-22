import { DEFAULT_TUNING } from '@slur/shared';
import type { Entity } from 'koota';
import { Interp, Sim } from '../ecs/traits';

function clamp01( v: number ): number {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

export const DRIVE_EXTINGUISHED = -1;

export function exhaustDrive( entity: Entity ): number {
    const sim = entity.get( Sim );
    if ( sim ) return sim.dead ? DRIVE_EXTINGUISHED : clamp01( sim.vz / DEFAULT_TUNING.maxCruise );

    const buffer = entity.get( Interp )?.buffer;
    if ( ! buffer || buffer.length < 2 ) return DRIVE_EXTINGUISHED;
    const last = buffer[ buffer.length - 1 ];
    const prev = buffer[ buffer.length - 2 ];
    if ( last.dead ) return DRIVE_EXTINGUISHED;
    const span = ( last.t - prev.t ) / 1000;
    if ( span <= 0 ) return 0;
    return clamp01( ( last.z - prev.z ) / span / DEFAULT_TUNING.maxCruise );
}
