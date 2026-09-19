import type { Track } from '@slur/shared';
import { Fragment } from 'react';
import { TrackBlocks } from './track-blocks';
import { TrackRibbon } from './track-ribbon';

/**
 * The whole track as the game shows it: ribbon plus hazard blocks, and nothing but a composer.
 *
 * The two halves are separate leaves because `/art-lab` needs the rail without the blocks.
 */
export function TrackView( { track }: { track: Track } ) {
    return (
        <Fragment>
            <TrackRibbon track={ track } />
            <TrackBlocks track={ track } />
        </Fragment>
    );
}
