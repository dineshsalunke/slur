import { pickupsOf } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { BoltPickups } from '../../../game/scene/bolt-pickups/bolt-pickups';
import { BoostPickups } from '../../../game/scene/boost-pickups/boost-pickups';
import { MinePickups } from '../../../game/scene/mine-pickups/mine-pickups';
import { SeekerPickups } from '../../../game/scene/seeker-pickups/seeker-pickups';
import { splitPickupLayout } from '../../../game/scene/seeker-pickups/seeker-pickups.utils';
import { ShieldPickups } from '../../../game/scene/shield-pickups/shield-pickups';
import { useTrack } from '../../../game/track-context/use-track';
import { isTaken } from './local-pickup-field.utils';

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
