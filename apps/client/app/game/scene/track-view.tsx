import { Fragment } from 'react';
import { TrackBlocks } from './track-blocks';
import { TrackFloor } from './track-floor';
import { TrackRail } from './track-rail/track-rail';
import { TrackRim } from './track-rim';
import { TrackSeams } from './track-seams';

export function TrackView() {
    return (
        <Fragment>
            <TrackFloor />
            <TrackSeams />
            <TrackRail />
            <TrackRim />
            <TrackBlocks />
        </Fragment>
    );
}
