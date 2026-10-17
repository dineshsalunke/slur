import { pickupsOf } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { FeatureViews } from '../../engine/feature-views/feature-views';
import { isPickupTaken } from '../pickup-state';
import { useTrack } from '../track-context/use-track';
import { PickupReflections } from './pickup-reflections/pickup-reflections';

export function PickupField() {
    const track = useTrack();
    const all = useMemo( () => pickupsOf( track ), [ track ] );

    return (
        <Fragment>
            <PickupReflections layout={ all } isTaken={ isPickupTaken } />
            <FeatureViews slot="pickups" />
        </Fragment>
    );
}
