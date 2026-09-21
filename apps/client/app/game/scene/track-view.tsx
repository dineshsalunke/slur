import type { Track } from '@slur/shared';
import { Fragment } from 'react';
import { TrackBlocks } from './track-blocks';
import { TrackBoundary } from './track-boundary';
import { TrackFloor } from './track-floor';

export function TrackView( { track }: { track: Track } ) {
    return (
        <Fragment>
            <TrackFloor track={ track } />
            <TrackBoundary track={ track } />
            <TrackBlocks track={ track } />
        </Fragment>
    );
}
