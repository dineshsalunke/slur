import { BOLT_SPAWN_AHEAD, BOLT_SPEED, BOLT_TTL } from '@slur/shared';
import { type BoltSink, BoltStreaks } from '../../game/scene/bolt-streaks';
import { localCombat } from './local-combat';

function collect( sink: BoltSink ): void {
    for ( const bolt of localCombat.bolts.values() ) {
        sink( bolt.x, bolt.y, bolt.z, ( BOLT_TTL - bolt.ttl ) * BOLT_SPEED + BOLT_SPAWN_AHEAD, bolt.dir );
    }
}

export function LocalBoltField() {
    return <BoltStreaks collect={ collect } />;
}
