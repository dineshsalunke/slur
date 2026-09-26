import type { Entity } from 'koota';
import { Interp, Sim } from '../ecs/traits';

export function isDead( entity: Entity ): boolean {
    const sim = entity.get( Sim );
    if ( sim ) return sim.dead;
    const buf = entity.get( Interp )?.buffer;
    return buf !== undefined && buf.length > 0 && buf[ buf.length - 1 ].dead;
}
