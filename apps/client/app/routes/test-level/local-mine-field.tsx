import { MineBodies, type MineSink } from '../../game/scene/mine-bodies';
import { localCombat } from './local-combat';

function collect( sink: MineSink ): void {
    for ( const m of localCombat.mines.values() ) sink( m.x, m.y, m.z, m.armed );
}

export function LocalMineField() {
    return <MineBodies collect={ collect } />;
}
