import { HALF_WIDTH, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { trackRails } from './track-rails.state';

function trackOf( segments: number ): Track {
    const at = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: [],
        isFinish: false,
    } );
    return {
        finishZ: segments * SEG_LEN,
        anchors: [],
        segmentAt: at,
        segmentAtZ: ( z: number ) => at( Math.floor( z / SEG_LEN ) ),
    };
}

describe( 'track rails cache', () => {
    it( 'builds the runs once per track', () => {
        const track = trackOf( 4 );
        const first = trackRails( track, 4 );
        expect( trackRails( track, 4 ) ).toBe( first );
        expect( trackRails( track, 4 ).runs ).toBe( first.runs );
    } );

    it( 'rebuilds the runs when a new track is built', () => {
        const old = trackRails( trackOf( 3 ), 3 );
        const next = trackRails( trackOf( 3 ), 3 );
        expect( next ).not.toBe( old );
        expect( next.runs ).not.toBe( old.runs );
    } );
} );
