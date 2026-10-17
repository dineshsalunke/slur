import { pickupsOf } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { FeatureViews } from '../../engine/feature-views/feature-views';
import { isPickupTaken } from '../pickup-state';
import { useTrack } from '../track-context/use-track';
import { splitPickupLayout } from './pickup-layout/pickup-layout.utils';
import { PickupReflections } from './pickup-reflections/pickup-reflections';
import { PortalPickups } from './portal-pickups/portal-pickups';

export function PickupField() {
    const track = useTrack();
    const all = useMemo( () => pickupsOf( track ), [ track ] );
    const layout = useMemo( () => splitPickupLayout( all ), [ all ] );

    return (
        <Fragment>
            <PickupReflections layout={ all } isTaken={ isPickupTaken } />
            <PortalPickups layout={ layout.portals } isTaken={ isPickupTaken } />
            <FeatureViews slot="pickups" />
        </Fragment>
    );
}
