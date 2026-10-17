import { pickupsOf } from '@slur/shared';
import { useMemo } from 'react';
import { isPickupTaken } from '../../../game/pickup-state';
import { PickupInstances } from '../../../game/scene/pickup-instances/pickup-instances';
import { useTrack } from '../../../game/track-context/use-track';
import { buildShieldPickup, shieldAnchors } from './shield-pickups.utils';

export function ShieldPickups() {
    const track = useTrack();
    const layout = useMemo( () => shieldAnchors( pickupsOf( track ) ), [ track ] );
    return <PickupInstances layout={ layout } isTaken={ isPickupTaken } buildBody={ buildShieldPickup } />;
}
