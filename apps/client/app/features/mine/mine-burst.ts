import type { MineEvent } from '@slur/shared';
import { pushHit } from '../../game/scene/hit-events';
import { pushMineShock, type ShockKind } from '../../game/scene/mine-shock-events';

const SPARK_LIFT = 0.5;

function kindOf( e: MineEvent ): ShockKind {
    if ( e.outcome === 'trigger' ) return 'big';
    return e.outcome === 'fizzle' ? 'fizzle' : 'small';
}

export function burstMine( e: MineEvent ): void {
    pushMineShock( { x: e.x, y: e.y, z: e.z, kind: kindOf( e ) } );
    if ( e.outcome === 'cleared' || e.outcome === 'fizzle' ) pushHit( { x: e.x, y: e.y + SPARK_LIFT, z: e.z } );
}
