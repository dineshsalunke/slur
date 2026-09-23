import { pickupsOf, type Track } from '@slur/shared';
import { useMemo } from 'react';
import { BoltPickups } from '../../game/scene/bolt-pickups';
import { localCombat } from './local-combat';

function isTaken( id: string ): boolean {
    return localCombat.taken.get( id ) === true;
}

export function LocalPickupField( { track }: { track: Track } ) {
    const layout = useMemo( () => pickupsOf( track ), [ track ] );
    return <BoltPickups layout={ layout } isTaken={ isTaken } />;
}
