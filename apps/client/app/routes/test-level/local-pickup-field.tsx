import { pickupsOf } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { BoltPickups } from '../../game/scene/bolt-pickups';
import { BoostPickups } from '../../game/scene/boost-pickups';
import { MinePickups } from '../../game/scene/mine-pickups';
import { SeekerPickups, splitPickupLayout } from '../../game/scene/seeker-pickups';
import { ShieldPickups } from '../../game/scene/shield-pickups';
import { useTrack } from '../../game/track-context/use-track';
import { localCombat } from './local-combat';

function isTaken( id: string ): boolean {
    return localCombat.taken.get( id ) === true;
}

export function LocalPickupField() {
    const track = useTrack();
    const layout = useMemo( () => splitPickupLayout( pickupsOf( track ) ), [ track ] );
    return (
        <Fragment>
            <BoltPickups layout={ layout.bolts } isTaken={ isTaken } />
            <SeekerPickups layout={ layout.seekers } isTaken={ isTaken } />
            <MinePickups layout={ layout.mines } isTaken={ isTaken } />
            <BoostPickups layout={ layout.boosts } isTaken={ isTaken } />
            <ShieldPickups layout={ layout.shields } isTaken={ isTaken } />
        </Fragment>
    );
}
