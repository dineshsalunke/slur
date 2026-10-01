import { pickupsOf } from '@slur/shared';
import { useMemo } from 'react';
import { isPickupTaken } from '../../../game/pickup-state';
import { PickupInstances } from '../../../game/scene/pickup-instances/pickup-instances';
import { useTrack } from '../../../game/track-context/use-track';
import { buildSeekerPickup, seekerAnchors } from './seeker-pickups.utils';

export function SeekerPickups() {
    const track = useTrack();
    const layout = useMemo( () => seekerAnchors( pickupsOf( track ) ), [ track ] );
    return <PickupInstances layout={ layout } isTaken={ isPickupTaken } buildBody={ buildSeekerPickup } />;
}
