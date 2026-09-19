import { BLOCK_HEIGHT } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { BLOCK_FAMILY, BLOCK_FOOTPRINTS, FAMILY_GAP, layOutFamily } from './block-dimensions';

// The height gate. `/iso-block` runs with `rig={false}`, which also drops `<ScaleReference>` (its emissive
// cyan #3BD6FF is off-palette and a bloom magnet next to a dark block), so there is no ruler to eyeball the
// 8u against. That is the better trade: a dimension encoding un-jumpability deserves a check that fails
// loudly, not an eye judging a bar.
describe( 'sealed block dimensions', () => {
    it( 'is exactly 8u tall — above double-jump reach, so the block is un-jumpable by design', () => {
        expect( BLOCK_HEIGHT ).toBe( 8 );
    } );

    it( 'leaves width and depth free — any real-valued footprint is legal (GDD §0)', () => {
        for ( const { width, depth } of BLOCK_FOOTPRINTS ) {
            expect( width ).toBeGreaterThan( 0 );
            expect( depth ).toBeGreaterThan( 0 );
        }
    } );

    it( 'varies aspect ratio, never height — the family is three footprints, not three sizes', () => {
        const ratios = BLOCK_FOOTPRINTS.map( ( f ) => f.width / f.depth );
        expect( new Set( ratios ).size ).toBe( BLOCK_FOOTPRINTS.length );
    } );
} );

describe( 'family layout', () => {
    it( 'centres the row on the origin', () => {
        const { blocks, span } = BLOCK_FAMILY;
        const left = blocks[ 0 ].x - blocks[ 0 ].width / 2;
        const last = blocks[ blocks.length - 1 ];
        const right = last.x + last.width / 2;

        expect( left ).toBeCloseTo( -span / 2 );
        expect( right ).toBeCloseTo( span / 2 );
    } );

    it( 'leaves exactly the requested clear air between neighbours', () => {
        const { blocks } = BLOCK_FAMILY;
        for ( let i = 1; i < blocks.length; i++ ) {
            const gap = blocks[ i ].x - blocks[ i ].width / 2 - ( blocks[ i - 1 ].x + blocks[ i - 1 ].width / 2 );
            expect( gap ).toBeCloseTo( FAMILY_GAP );
        }
    } );

    it( 'spans a single footprint with no gap', () => {
        expect( layOutFamily( [ { width: 4, depth: 8 } ], 3 ).span ).toBe( 4 );
    } );
} );
