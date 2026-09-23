import { describe, expect, it } from 'vitest';
import { ARCH_GROWTH, archHeight, archRows, monolithLayout } from './arch-field';
import { PILLAR_FIELD } from './monolith-config';
import { pillarRows } from './monolith-field';
import { ARCH_FRAME } from './monolith-frame';

describe( 'archRows', () => {
    it( 'picks the row nearest each quarter of the track', () => {
        const rows = [ 0, 180, 260, 490, 540, 760, 790, 1000 ];
        expect( archRows( 1000, rows ) ).toEqual( [ 260, 490, 760 ] );
    } );

    it( 'never takes one row twice', () => {
        expect( archRows( 1000, [ 0, 480, 520 ] ) ).toEqual( [ 0, 480, 520 ] );
    } );

    it( 'returns fewer arches when there are fewer rows', () => {
        expect( archRows( 1000, [ 500 ] ) ).toEqual( [ 500 ] );
        expect( archRows( 1000, [] ) ).toEqual( [] );
    } );
} );

describe( 'archHeight', () => {
    it( 'grows from the base height by at most ARCH_GROWTH', () => {
        for ( const z of [ 1000, 4000, 7000 ] ) {
            const h = archHeight( z, 8000 );
            expect( h ).toBeGreaterThanOrEqual( ARCH_FRAME.height );
            expect( h ).toBeLessThanOrEqual( ARCH_FRAME.height * ( 1 + ARCH_GROWTH ) );
        }
    } );
} );

describe( 'monolithLayout', () => {
    const layout = monolithLayout( 8000, PILLAR_FIELD );
    const rows = pillarRows( 8000, PILLAR_FIELD );

    it( 'stands three arches, each on a pillar row', () => {
        expect( layout.arches ).toHaveLength( 3 );
        for ( const a of layout.arches ) expect( rows ).toContain( a.z );
    } );

    it( 'replaces the pillar pair at an arch and drops no other row', () => {
        const arched = new Set( layout.arches.map( ( a ) => a.z ) );
        const pillared = new Set( layout.pillars.map( ( p ) => p.z ) );
        for ( const z of rows ) expect( arched.has( z ) !== pillared.has( z ) ).toBe( true );
        expect( layout.pillars ).toHaveLength( 2 * ( rows.length - 3 ) );
    } );
} );
