import { pickupsOf } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { isPickupTaken } from '../pickup-state';
import { useTrack } from '../track-context/use-track';
import { BoltPickups } from './bolt-pickups/bolt-pickups';
import { BoostPickups } from './boost-pickups/boost-pickups';
import { MinePickups } from './mine-pickups/mine-pickups';
import { SeekerPickups } from './seeker-pickups/seeker-pickups';
import { splitPickupLayout } from './seeker-pickups/seeker-pickups.utils';
import { ShieldPickups } from './shield-pickups/shield-pickups';

export function PickupField() {
    const track = useTrack();
    const layout = useMemo( () => splitPickupLayout( pickupsOf( track ) ), [ track ] );

    return (
        <Fragment>
            <BoltPickups layout={ layout.bolts } isTaken={ isPickupTaken } />
            <SeekerPickups layout={ layout.seekers } isTaken={ isPickupTaken } />
            <MinePickups layout={ layout.mines } isTaken={ isPickupTaken } />
            <BoostPickups layout={ layout.boosts } isTaken={ isPickupTaken } />
            <ShieldPickups layout={ layout.shields } isTaken={ isPickupTaken } />
        </Fragment>
    );
}
