import { Fragment } from 'react';
import type { RunRoomLike } from '../../net/run-room-like';
import { ACTIVE_FEATURES } from '../active-features';

export function FeatureOverlays( { room }: { room: RunRoomLike } ) {
    return (
        <Fragment>
            { ACTIVE_FEATURES.map( ( f ) => {
                const Overlay = f.hud?.overlay;
                return Overlay ? <Overlay key={ f.id } room={ room } /> : null;
            } ) }
        </Fragment>
    );
}
