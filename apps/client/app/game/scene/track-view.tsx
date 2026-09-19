import type { Track } from '@slur/shared';
import { Fragment } from 'react';
import { TrackBlocks } from './track-blocks';
import { TrackFloor } from './track-floor';
import { TrackRails } from './track-rails';

/**
 * The whole track as the game shows it: deck, edge rails and hazard blocks, and nothing but a composer.
 *
 * Three leaves rather than one because `/art-lab` mounts each on its own to judge it in isolation.
 */
export function TrackView( { track }: { track: Track } ) {
    return (
        <Fragment>
            <TrackFloor track={ track } />
            <TrackRails track={ track } />
            <TrackBlocks track={ track } />
        </Fragment>
    );
}
