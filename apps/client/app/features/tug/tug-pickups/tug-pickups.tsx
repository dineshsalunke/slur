import { pickupsOf } from '@slur/shared';
import { useMemo } from 'react';
import { isPickupTaken } from '../../../game/pickup-state';
import { PickupInstances } from '../../../game/scene/pickup-instances/pickup-instances';
import { useTrack } from '../../../game/track-context/use-track';
import { buildTugPickup, tugAnchors } from './tug-pickups.utils';

export function TugPickups() {
    const track = useTrack();
    const layout = useMemo( () => tugAnchors( pickupsOf( track ) ), [ track ] );
    return <PickupInstances layout={ layout } isTaken={ isPickupTaken } buildBody={ buildTugPickup } />;
}
