import { pickupsOf, type Track } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { BoltPickups } from '../../game/scene/bolt-pickups';
import { SeekerPickups, splitPickupLayout } from '../../game/scene/seeker-pickups';
import { localCombat } from './local-combat';

function isTaken( id: string ): boolean {
    return localCombat.taken.get( id ) === true;
}

export function LocalPickupField( { track }: { track: Track } ) {
    const layout = useMemo( () => splitPickupLayout( pickupsOf( track ) ), [ track ] );
    return (
        <Fragment>
            <BoltPickups layout={ layout.bolts } isTaken={ isTaken } />
            <SeekerPickups layout={ layout.seekers } isTaken={ isTaken } />
        </Fragment>
    );
}
