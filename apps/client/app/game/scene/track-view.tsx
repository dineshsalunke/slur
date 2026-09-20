import type { Track } from '@slur/shared';
import { Fragment } from 'react';
import { TrackBlocks } from './track-blocks';
import { TrackBoundary } from './track-boundary';
import { TrackFloor } from './track-floor';

/**
 * The whole track as the game shows it: deck, outer boundary and hazard blocks, and nothing but a composer.
 *
 * Three leaves rather than one because `/art-lab` mounts each on its own to judge it in isolation.
 */
export function TrackView( { track }: { track: Track } ) {
    return (
        <Fragment>
            <TrackFloor track={ track } />
            <TrackBoundary track={ track } />
            <TrackBlocks track={ track } />
        </Fragment>
    );
}
