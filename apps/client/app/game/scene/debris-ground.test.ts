import { HALF_WIDTH, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { describe, expect, it, vi } from 'vitest';
import { trackGround } from './debris-ground';

function trackOf(): Track {
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
        finishZ: 200 * SEG_LEN,
        anchors: [],
        segmentAt: vi.fn( at ),
        segmentAtZ: ( z: number ) => at( Math.floor( z / SEG_LEN ) ),
    };
}

describe( 'debris ground', () => {
    it( 'shares one ground per track and broken set', () => {
        const track = trackOf();
        const broken = new Set< number >();
        const ground = trackGround( track, broken );
        expect( trackGround( track, broken ) ).toBe( ground );
        expect( trackGround( track, new Set() ) ).not.toBe( ground );
        expect( trackGround( trackOf(), broken ) ).not.toBe( ground );
    } );

    it( 'keeps recent segments when the cache is full', () => {
        const track = trackOf();
        const ground = trackGround( track, new Set() );
        for ( let i = 0; i < 100; i++ ) expect( ground.floor( 0, ( i + 0.5 ) * SEG_LEN, 10 ) ).toBe( 0 );
        const calls = vi.mocked( track.segmentAt ).mock.calls.length;
        ground.floor( 0, 50.5 * SEG_LEN, 10 );
        expect( vi.mocked( track.segmentAt ).mock.calls.length ).toBe( calls );
    } );
} );
