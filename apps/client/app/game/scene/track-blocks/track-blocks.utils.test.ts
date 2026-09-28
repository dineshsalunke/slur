import { type Block, HALF_WIDTH, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { clearBlockState, confirmBreak } from '../../block-state';
import { SEALED_BLOCK_OPEN_X0, SEALED_BLOCK_OPEN_X1 } from '../sealed-block-variation';
import { AHEAD, BACK } from '../track-instancing';
import { BLOCK_LIMIT, FRACTURED_LIMIT } from './track-blocks.constants';
import { blockCapacity, openEnds } from './track-blocks.utils';

function denseTrack( length: number, perSegment: ( i: number ) => number ): Track {
    const segments = Array.from( { length }, ( _, i ): Segment => {
        const z0 = i * SEG_LEN;
        const blocks = Array.from(
            { length: perSegment( i ) },
            ( _, k ): Block =>
                ( {
                    id: i * 1000 + k,
                    kind: k % 4 === 0 ? 'fractured' : 'sealed',
                    x0: -20 + k,
                    x1: -19.5 + k,
                    y0: 0,
                    y1: 4,
                    z0,
                    z1: z0 + SEG_LEN,
                } ) as Block,
        );
        return { index: i, z0, z1: z0 + SEG_LEN, kind: 'block', floors: [], blocks, isFinish: false } as Segment;
    } );
    const empty = ( i: number ): Segment =>
        ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'plain',
            floors: [],
            blocks: [],
            isFinish: false,
        } ) as Segment;
    const segmentAt = ( i: number ): Segment => segments[ i ] ?? empty( i );
    return {
        finishZ: length * SEG_LEN,
        segmentAt,
        segmentAtZ: ( z ) => segmentAt( Math.floor( z / SEG_LEN ) ),
        anchors: [],
    };
}

function worstDrawnWindow( track: Track ): { sealed: number; fractured: number } {
    let sealed = 0;
    let fractured = 0;
    for ( let z = 0; z <= track.finishZ; z += 5 ) {
        const i0 = Math.max( 0, Math.floor( ( z - BACK ) / SEG_LEN ) );
        const i1 = Math.floor( ( z + AHEAD ) / SEG_LEN );
        let s = 0;
        let f = 0;
        for ( let i = i0; i <= i1; i++ ) {
            for ( const b of track.segmentAt( i ).blocks ) {
                if ( b.kind === 'fractured' ) f++;
                else s++;
            }
        }
        sealed = Math.max( sealed, s );
        fractured = Math.max( fractured, f );
    }
    return { sealed, fractured };
}

describe( 'blockCapacity', () => {
    it( 'holds every block of the densest window of an authored-dense level', () => {
        const track = denseTrack( 300, ( i ) => ( i > 100 && i < 200 ? 24 : 2 ) );
        const worst = worstDrawnWindow( track );
        const cap = blockCapacity( track );
        expect( worst.sealed ).toBeGreaterThan( BLOCK_LIMIT );
        expect( worst.fractured ).toBeGreaterThan( FRACTURED_LIMIT );
        expect( cap.sealed ).toBeGreaterThanOrEqual( worst.sealed );
        expect( cap.fractured ).toBeGreaterThanOrEqual( worst.fractured );
    } );

    it( 'keeps the default limits for a sparse track', () => {
        const cap = blockCapacity( denseTrack( 300, () => 1 ) );
        expect( cap ).toEqual( { sealed: BLOCK_LIMIT, fractured: FRACTURED_LIMIT } );
    } );
} );

function wall( id: number, x0: number, x1: number, z0 = 0, z1 = 4 ): Block {
    return { id, kind: 'sealed', x0, x1, y0: 0, y1: 6, z0, z1 } as Block;
}

describe( 'openEnds', () => {
    afterEach( () => clearBlockState() );

    it( 'opens only the end that faces the gap on a wall run from the rail', () => {
        const b = wall( 1, -HALF_WIDTH, -10 );
        expect( openEnds( b, [ b ] ) ).toBe( SEALED_BLOCK_OPEN_X1 );
    } );

    it( 'opens both ends of a free-standing block', () => {
        const b = wall( 1, -8, 8 );
        expect( openEnds( b, [ b ] ) ).toBe( SEALED_BLOCK_OPEN_X0 | SEALED_BLOCK_OPEN_X1 );
    } );

    it( 'closes an end butted by a neighbour and reopens it when the neighbour breaks', () => {
        const b = wall( 1, -8, 8 );
        const n = wall( 2, 8, 14 );
        expect( openEnds( b, [ b, n ] ) ).toBe( SEALED_BLOCK_OPEN_X0 );
        confirmBreak( n.id );
        expect( openEnds( b, [ b, n ] ) ).toBe( SEALED_BLOCK_OPEN_X0 | SEALED_BLOCK_OPEN_X1 );
    } );

    it( 'ignores a block that shares an x edge but not the z span', () => {
        const b = wall( 1, -8, 8 );
        const n = wall( 2, 8, 14, 10, 14 );
        expect( openEnds( b, [ b, n ] ) ).toBe( SEALED_BLOCK_OPEN_X0 | SEALED_BLOCK_OPEN_X1 );
    } );
} );
