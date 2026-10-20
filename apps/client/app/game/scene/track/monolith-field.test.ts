import { SEG_LEN, START_SAFE } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { PILLAR_FIELD } from './monolith-config';
import { MIN_SPACING, monolithSpacing, pillarPairs, pillarRows } from './monolith-field';

describe( 'monolithSpacing', () => {
    it( 'lerps from calm to intense', () => {
        expect( monolithSpacing( 0, 140, 36 ) ).toBe( 140 );
        expect( monolithSpacing( 1, 140, 36 ) ).toBe( 36 );
        expect( monolithSpacing( 0.5, 140, 36 ) ).toBe( 88 );
    } );

    it( 'never returns less than MIN_SPACING', () => {
        expect( monolithSpacing( 1, 0, 0 ) ).toBe( MIN_SPACING );
    } );
} );

describe( 'pillarPairs', () => {
    const field = pillarPairs( pillarRows( 8000, PILLAR_FIELD ) );
    const zs = ( side: number ) => field.filter( ( p ) => p.side === side ).map( ( p ) => p.z );

    it( 'stands every pillar opposite its twin', () => {
        expect( zs( 1 ) ).toEqual( zs( -1 ) );
        expect( zs( -1 ) ).toEqual( pillarRows( 8000, PILLAR_FIELD ) );
    } );

    it( 'drops no row', () => {
        const rows = pillarRows( 8000, PILLAR_FIELD );
        for ( let i = 1; i < rows.length; i++ ) {
            expect( rows[ i ] - rows[ i - 1 ] ).toBeLessThanOrEqual( PILLAR_FIELD.spacingCalm );
            expect( rows[ i ] - rows[ i - 1 ] ).toBeGreaterThanOrEqual( PILLAR_FIELD.spacingIntense );
        }
    } );

    it( 'starts past the safe zone and stays inside the track', () => {
        expect( Math.min( ...zs( -1 ) ) ).toBe( START_SAFE * SEG_LEN );
        for ( const p of field ) expect( p.z ).toBeLessThan( 8000 );
    } );

    it( 'packs rows tighter through a peak than through a trough', () => {
        const z = pillarRows( 8000, { spacingCalm: 140, spacingIntense: 36 } );
        const gapNear = ( target: number ) => {
            let best = 0;
            for ( let i = 0; i < z.length - 1; i++ ) {
                if ( Math.abs( z[ i ] - target ) < Math.abs( z[ best ] - target ) ) best = i;
            }
            return z[ best + 1 ] - z[ best ];
        };
        expect( gapNear( 7200 ) ).toBeLessThan( gapNear( 6000 ) );
    } );

    it( 'terminates on a degenerate spacing request', () => {
        expect( pillarRows( 800, { spacingCalm: 0, spacingIntense: 0 } ).length ).toBeGreaterThan( 0 );
    } );
} );
