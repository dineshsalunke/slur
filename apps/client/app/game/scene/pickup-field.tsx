import { pickupsOf } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { isPickupTaken } from '../pickup-state';
import { useTrack } from '../track-context/use-track';
import { BoltPickups } from './bolt-pickups';
import { BoostPickups } from './boost-pickups';
import { MinePickups } from './mine-pickups';
import { SeekerPickups, splitPickupLayout } from './seeker-pickups';
import { ShieldPickups } from './shield-pickups';

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
