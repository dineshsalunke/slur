import { BOLT_SPAWN_AHEAD, BOLT_SPEED, BOLT_TTL } from '@slur/shared';
import type { BoltSink } from '../../../game/scene/bolt-streaks';
import { emitMineShot, mineNow } from '../../../game/scene/mine-shots';
import { localCombat } from '../local-combat';

export function collect( sink: BoltSink ): void {
    for ( const bolt of localCombat.bolts.values() ) {
        sink( bolt.x, bolt.y, bolt.z, ( BOLT_TTL - bolt.ttl ) * BOLT_SPEED + BOLT_SPAWN_AHEAD, bolt.dir );
    }
    const now = mineNow();
    for ( const [ id, t ] of localCombat.throws ) {
        const mine = localCombat.mines.get( id );
        if ( mine ) emitMineShot( sink, t, mine, now );
    }
}
