import { Fragment } from 'react';
import { ACTIVE_FEATURES } from '../active-features';
import type { ShipViewProps } from '../define-client-feature';

export function FeatureShipViews( { entity, shipId }: ShipViewProps ) {
    return (
        <Fragment>
            { ACTIVE_FEATURES.map( ( f ) => {
                const View = f.views?.ship;
                return View ? <View key={ f.id } entity={ entity } shipId={ shipId } /> : null;
            } ) }
        </Fragment>
    );
}
