import type { Track } from '@slur/shared';
import { Fragment } from 'react';
import { TrackBlocks } from './track-blocks';
import { TrackRibbon } from './track-ribbon';

/**
 * The whole track as the game shows it: ribbon plus hazard blocks.
 *
 * It is only a composer. The two halves are separately mountable leaves because `/art-lab` needs the rail
 * WITHOUT the blocks — they used to be one component, which is why untextured boxes sat in every art review
 * frame. Track is local-only (materialized from the synced descriptor), never reconciled tile-by-tile.
 */
export function TrackView( { track }: { track: Track } ) {
    return (
        <Fragment>
            <TrackRibbon track={ track } />
            <TrackBlocks track={ track } />
        </Fragment>
    );
}
