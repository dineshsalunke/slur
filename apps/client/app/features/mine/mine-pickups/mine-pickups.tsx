import { pickupsOf } from '@slur/shared';
import { useMemo } from 'react';
import { isPickupTaken } from '../../../game/pickup-state';
import { PickupInstances } from '../../../game/scene/pickup-instances/pickup-instances';
import { useTrack } from '../../../game/track-context/use-track';
import { buildMinePickup, mineAnchors } from './mine-pickups.utils';

export function MinePickups() {
    const track = useTrack();
    const layout = useMemo( () => mineAnchors( pickupsOf( track ) ), [ track ] );
    return <PickupInstances layout={ layout } isTaken={ isPickupTaken } buildBody={ buildMinePickup } />;
}
