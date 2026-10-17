import { pickupsOf } from '@slur/shared';
import { useMemo } from 'react';
import { isPickupTaken } from '../../../game/pickup-state';
import { PickupInstances } from '../../../game/scene/pickup-instances/pickup-instances';
import { useTrack } from '../../../game/track-context/use-track';
import { boostAnchors, buildBoostPickup } from './boost-pickups.utils';

export function BoostPickups() {
    const track = useTrack();
    const layout = useMemo( () => boostAnchors( pickupsOf( track ) ), [ track ] );
    return <PickupInstances layout={ layout } isTaken={ isPickupTaken } buildBody={ buildBoostPickup } />;
}
