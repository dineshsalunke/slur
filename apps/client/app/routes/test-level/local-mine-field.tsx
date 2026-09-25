import { MineBodies, type MineSink } from '../../game/scene/mine-bodies';
import { emitMineBody, mineNow } from '../../game/scene/mine-shots';
import type { MineThrow } from '../../game/scene/mine-throw';
import { localCombat } from './local-combat';

const SETTLED: MineThrow = { bornAt: Number.NEGATIVE_INFINITY, fromX: 0, fromY: 0, fromZ: 0, dir: 1 };

function collect( sink: MineSink ): void {
    const now = mineNow();
    for ( const id of localCombat.throws.keys() ) if ( ! localCombat.mines.has( id ) ) localCombat.throws.delete( id );
    for ( const [ id, m ] of localCombat.mines ) emitMineBody( sink, localCombat.throws.get( id ) ?? SETTLED, m, now );
}

export function LocalMineField() {
    return <MineBodies collect={ collect } />;
}
