import { describe, expect, it } from 'vitest';
import { SEALED_BLOCK_BEVEL } from './sealed-block-geometry';
import {
    SEALED_BLOCK_MAX_SEAMS,
    SEALED_BLOCK_SEAM_WIDTH,
    SEALED_BLOCK_WEAR,
    sealedBlockInset,
    sealedBlockPerimeter,
    sealedBlockSeamCount,
    sealedBlockSeams,
    sealedBlockSeed,
    sealedBlockWearSeed,
} from './sealed-block-variation';

const FOOTPRINTS = [
    { w: 4, h: 8, d: 8 },
    { w: 5.5, h: 5.5, d: 8 },
    { w: 3.5, h: 5, d: 8 },
];

describe( 'sealed block perimeter', () => {
    it( 'walks the inset rectangle the chamfer strips sit outside of', () => {
        for ( const dims of FOOTPRINTS ) {
            const [ a, b ] = sealedBlockInset( dims );
            expect( a ).toBeCloseTo( dims.w / 2 - SEALED_BLOCK_BEVEL );
            expect( b ).toBeCloseTo( dims.d / 2 - SEALED_BLOCK_BEVEL );
            expect( sealedBlockPerimeter( dims ) ).toBeCloseTo( 2 * ( dims.w + dims.d ) - 8 * SEALED_BLOCK_BEVEL );
        }
    } );
} );

describe( 'sealed block seams', () => {
    it( 'is reproducible from the seed alone', () => {
        const dims = FOOTPRINTS[ 0 ];
        expect( sealedBlockSeams( 1234, 3, dims ) ).toEqual( sealedBlockSeams( 1234, 3, dims ) );
        expect( sealedBlockSeamCount( 1234 ) ).toBe( sealedBlockSeamCount( 1234 ) );
    } );

    it( 'actually varies across seeds', () => {
        const dims = FOOTPRINTS[ 0 ];
        const first = new Set< number >();
        const counts = new Set< number >();
        for ( let x = 0; x < 64; x += 4 ) {
            const seed = sealedBlockSeed( x, x * 3 );
            first.add( Math.round( sealedBlockSeams( seed, 3, dims )[ 0 ] * 1000 ) );
            counts.add( sealedBlockSeamCount( seed ) );
        }
        expect( first.size ).toBeGreaterThan( 10 );
        expect( counts.size ).toBeGreaterThan( 1 );
    } );

    it( 'stays on the perimeter, stratified so two seams never merge', () => {
        const dims = FOOTPRINTS[ 0 ];
        const p = sealedBlockPerimeter( dims );
        const [ a, b ] = sealedBlockInset( dims );
        const corners = [ 0, 2 * b, 2 * b + 2 * a, 4 * b + 2 * a, p ];
        const worst = {
            u: Number.POSITIVE_INFINITY,
            top: Number.NEGATIVE_INFINITY,
            gap: Number.POSITIVE_INFINITY,
            corner: Number.POSITIVE_INFINITY,
        };

        for ( let seed = 0; seed < 200; seed++ ) {
            for ( let n = 1; n <= SEALED_BLOCK_MAX_SEAMS; n++ ) {
                const seams = sealedBlockSeams( seed, n, dims );
                expect( seams ).toHaveLength( n );
                worst.u = Math.min( worst.u, ...seams );
                worst.top = Math.max( worst.top, ...seams );
                worst.gap = Math.min( worst.gap, ...seams.slice( 1 ).map( ( u, i ) => u - seams[ i ] ) );
                for ( const u of seams ) {
                    worst.corner = Math.min( worst.corner, ...corners.map( ( c ) => Math.abs( u - c ) ) );
                }
            }
        }

        expect( worst.u ).toBeGreaterThanOrEqual( 0 );
        expect( worst.top ).toBeLessThan( p );
        expect( worst.gap ).toBeGreaterThan( 4 * SEALED_BLOCK_SEAM_WIDTH );
        expect( worst.corner ).toBeGreaterThan( SEALED_BLOCK_SEAM_WIDTH );
    } );

    it( "caps at the shader's seam slots and accepts none", () => {
        const dims = FOOTPRINTS[ 0 ];
        expect( sealedBlockSeams( 7, 99, dims ) ).toHaveLength( SEALED_BLOCK_MAX_SEAMS );
        expect( sealedBlockSeams( 7, 0, dims ) ).toEqual( [] );
    } );

    it( 'keeps the count inside the family board 28 describes', () => {
        for ( let seed = -500; seed < 500; seed++ ) {
            const n = sealedBlockSeamCount( seed );
            expect( n ).toBeGreaterThanOrEqual( 1 );
            expect( n ).toBeLessThanOrEqual( SEALED_BLOCK_MAX_SEAMS );
        }
    } );
} );

describe( 'sealed block wear', () => {
    it( 'ships clean', () => {
        expect( SEALED_BLOCK_WEAR.strength ).toBe( 0 );
    } );

    it( 'seeds a distinct block per placement', () => {
        const seeds = new Set< number >();
        for ( let x = -32; x <= 32; x += 4 ) {
            for ( let z = 0; z < 200; z += 20 ) seeds.add( sealedBlockSeed( x, z ) );
        }
        expect( seeds.size ).toBe( 17 * 10 );
    } );

    it( 'spans the clean-to-worn range board 28 draws', () => {
        const strengths = [];
        for ( let x = -32; x <= 32; x += 4 ) {
            for ( let z = 0; z < 400; z += 20 ) strengths.push( sealedBlockWearSeed( sealedBlockSeed( x, z ) ) );
        }

        for ( const s of strengths ) expect( s ).toBeGreaterThanOrEqual( 0 );
        for ( const s of strengths ) expect( s ).toBeLessThanOrEqual( 1 );

        const clean = strengths.filter( ( s ) => s === 0 ).length / strengths.length;
        expect( clean ).toBeGreaterThan( 0.2 );
        expect( clean ).toBeLessThan( 0.6 );
        expect( Math.max( ...strengths ) ).toBeGreaterThan( 0.9 );
    } );
} );
