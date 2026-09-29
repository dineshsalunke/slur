import type { Block, Segment } from '@slur/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { clearBlockState, confirmBreak } from '../../block-state';
import { SEAM_CLEAR_REACH } from './block-reflections.constants';
import { type SeamFoot, seamFoot, seamFree } from './block-reflections.utils';

function box( id: number, x0: number, x1: number, z0: number, z1: number, y0 = 0 ): Block {
    return { id, kind: 'sealed', x0, x1, y0, y1: y0 + 8, z0, z1 };
}

function segOf( blocks: Block[] ): Segment {
    return { index: 0, z0: 0, z1: 40, kind: 'block', floors: [], blocks, isFinish: false };
}

const foot = (): SeamFoot => ( { x: 0, z: 0, nx: 0, nz: 0 } );

describe( 'block seam reflection clearance', () => {
    afterEach( () => clearBlockState() );

    it( 'maps a perimeter position to the seam foot and face normal', () => {
        const b = box( 1, -4, 4, 0, 16 );
        const side = seamFoot( b, 7.8, foot() );
        expect( side.z ).toBeCloseTo( 8, 5 );
        expect( [ side.x, side.nx, side.nz ] ).toEqual( [ 4, 1, 0 ] );
        const front = seamFoot( b, 42.6, foot() );
        expect( front.x ).toBeCloseTo( 0, 5 );
        expect( [ front.z, front.nx, front.nz ] ).toEqual( [ 0, 0, -1 ] );
    } );

    it( 'gives a seam on a buried end face no clear deck', () => {
        const rear = box( 1, -4, 4, 16, 24 );
        const front = box( 2, -4, 4, 0, 16 );
        const f = seamFoot( rear, 42.6 - 16, foot() );
        expect( f.nz ).toBe( -1 );
        expect( seamFree( rear, f, undefined, segOf( [ rear, front ] ), undefined ) ).toBe( 0 );
    } );

    it( 'measures the deck gap to the next block along the face normal', () => {
        const rear = box( 1, -4, 4, 16, 24 );
        const f = seamFoot( rear, 42.6 - 16, foot() );
        const ahead = segOf( [ box( 2, -2, 2, 0, 10 ) ] );
        expect( seamFree( rear, f, ahead, segOf( [ rear ] ), undefined ) ).toBeCloseTo( 6, 5 );
    } );

    it( 'ignores broken, off-line and raised neighbours', () => {
        const rear = box( 1, -4, 4, 16, 24 );
        const f = seamFoot( rear, 42.6 - 16, foot() );
        const broken = box( 2, -4, 4, 0, 16 );
        const aside = box( 3, 10, 14, 0, 16 );
        const raised = box( 4, -4, 4, 0, 16, 4 );
        confirmBreak( broken.id );
        expect( seamFree( rear, f, undefined, segOf( [ rear, broken, aside, raised ] ), undefined ) ).toBe(
            SEAM_CLEAR_REACH,
        );
    } );
} );
