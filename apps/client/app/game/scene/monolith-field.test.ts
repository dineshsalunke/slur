import { intensityAt, SEG_LEN, START_SAFE } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { MIN_SPACING, monolithField, monolithSpacing } from './monolith-field';

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

describe( 'monolithField', () => {
    const field = monolithField( 8000, 140, 36 );

    it( 'emits a matched pair at every z', () => {
        expect( field.length % 2 ).toBe( 0 );
        for ( let i = 0; i < field.length; i += 2 ) {
            expect( field[ i ].z ).toBe( field[ i + 1 ].z );
            expect( field[ i ].side ).toBe( -1 );
            expect( field[ i + 1 ].side ).toBe( 1 );
        }
    } );

    it( 'starts past the safe zone and stays inside the track', () => {
        expect( field[ 0 ].z ).toBe( START_SAFE * SEG_LEN );
        for ( const p of field ) expect( p.z ).toBeLessThan( 8000 );
    } );

    it( 'advances monotonically', () => {
        const zs = field.filter( ( p ) => p.side === -1 ).map( ( p ) => p.z );
        for ( let i = 1; i < zs.length; i++ ) expect( zs[ i ] ).toBeGreaterThan( zs[ i - 1 ] );
    } );

    it( 'packs monoliths tighter through a peak than through a trough', () => {
        const zs = field.filter( ( p ) => p.side === -1 ).map( ( p ) => p.z );
        const gapNear = ( target: number ) => {
            let best = 0;
            for ( let i = 0; i < zs.length - 1; i++ ) {
                if ( Math.abs( zs[ i ] - target ) < Math.abs( zs[ best ] - target ) ) best = i;
            }
            return zs[ best + 1 ] - zs[ best ];
        };
        expect( gapNear( 7200 ) ).toBeLessThan( gapNear( 6000 ) );
    } );

    it( 'terminates on a degenerate spacing request', () => {
        expect( monolithField( 800, 0, 0 ).length ).toBeGreaterThan( 0 );
    } );
} );
