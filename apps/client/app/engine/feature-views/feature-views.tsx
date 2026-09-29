import { Fragment } from 'react';
import { ACTIVE_FEATURES } from '../active-features';
import type { ViewSlot } from '../define-client-feature';

export function FeatureViews( { slot }: { slot: ViewSlot } ) {
    return (
        <Fragment>
            { ACTIVE_FEATURES.map( ( f ) => {
                const View = f.views?.[ slot ];
                return View ? <View key={ f.id } /> : null;
            } ) }
        </Fragment>
    );
}
