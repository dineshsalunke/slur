import { Fragment } from 'react';
import { DialSync } from './dial-sync/dial-sync';
import { TrackBlocks } from './track-blocks/track-blocks';
import { TrackFloor } from './track-floor/track-floor';
import { TrackRail } from './track-rail/track-rail';
import { TrackRim } from './track-rim/track-rim';
import { TrackSeams } from './track-seams';

export function TrackView() {
    return (
        <Fragment>
            <DialSync />
            <TrackFloor />
            <TrackSeams />
            <TrackRail />
            <TrackRim />
            <TrackBlocks />
        </Fragment>
    );
}
