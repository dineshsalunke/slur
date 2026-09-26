import type { MineSink } from '../../../game/scene/mine-bodies';
import { emitMineBody, mineNow } from '../../../game/scene/mine-shots';
import { localCombat } from '../local-combat';
import { SETTLED } from './local-mine-field.constants';

export function collect( sink: MineSink ): void {
    const now = mineNow();
    for ( const id of localCombat.throws.keys() ) if ( ! localCombat.mines.has( id ) ) localCombat.throws.delete( id );
    for ( const [ id, m ] of localCombat.mines ) emitMineBody( sink, localCombat.throws.get( id ) ?? SETTLED, m, now );
}
