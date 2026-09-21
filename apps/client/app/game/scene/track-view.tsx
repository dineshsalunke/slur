import type { Track } from '@slur/shared';
import { Fragment } from 'react';
import { TrackBlocks } from './track-blocks';
import { TrackBoundary } from './track-boundary';
import { TrackFloor } from './track-floor';

export function TrackView( { track, blocks = true }: { track: Track; blocks?: boolean } ) {
    return (
        <Fragment>
            <TrackFloor track={ track } />
            <TrackBoundary track={ track } />
            { blocks ? <TrackBlocks track={ track } /> : null }
        </Fragment>
    );
}
