import { BLOCK_HEIGHT } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_BLOCK } from './block-dimensions';

// The height gate. `/iso-block` runs with `rig={false}`, which also drops `<ScaleReference>` (its emissive
// cyan #3BD6FF is off-palette and a bloom magnet next to a dark block), so there is no ruler to eyeball the
// 8u against. That is the better trade: a dimension encoding un-jumpability deserves a check that fails
// loudly, not an eye judging a bar.
describe( 'sealed block dimensions', () => {
    it( 'is exactly 8u tall — above double-jump reach, so the block is un-jumpable by design', () => {
        expect( BLOCK_HEIGHT ).toBe( 8 );
        expect( PLACEHOLDER_BLOCK.height ).toBe( BLOCK_HEIGHT );
    } );

    it( 'leaves width and depth free — any real-valued footprint is legal (GDD §0)', () => {
        expect( PLACEHOLDER_BLOCK.width ).toBeGreaterThan( 0 );
        expect( PLACEHOLDER_BLOCK.depth ).toBeGreaterThan( 0 );
    } );
} );
