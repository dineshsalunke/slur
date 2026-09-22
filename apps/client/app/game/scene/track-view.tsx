import type { Track } from '@slur/shared';
import { Fragment } from 'react';
import { TrackBlocks } from './track-blocks';
import { TrackFloor } from './track-floor';
import { TrackRail } from './track-rail';
import { TrackRim } from './track-rim';
import { TrackSeams } from './track-seams';

export function TrackView( { track }: { track: Track } ) {
    return (
        <Fragment>
            <TrackFloor track={ track } />
            <TrackSeams track={ track } />
            <TrackRail track={ track } />
            <TrackRim track={ track } />
            <TrackBlocks track={ track } />
        </Fragment>
    );
}
