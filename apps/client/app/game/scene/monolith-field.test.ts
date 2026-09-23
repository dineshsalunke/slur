import { SEG_LEN, START_SAFE } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { MONOLITH_FIELD } from './monolith-config';
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
    const config = { ...MONOLITH_FIELD, spacingCalm: 140, spacingIntense: 36 };
    const field = monolithField( 8000, config );
    const zs = ( side: number ) => field.filter( ( p ) => p.side === side ).map( ( p ) => p.z );

    it( 'never puts a monolith opposite another — the two sides are not mirrored', () => {
        const left = new Set( zs( -1 ) );
        const paired = zs( 1 ).filter( ( z ) => left.has( z ) );
        expect( paired ).toEqual( [] );
    } );

    it( 'starts past the safe zone and stays inside the track', () => {
        expect( Math.min( ...zs( -1 ) ) ).toBe( START_SAFE * SEG_LEN );
        for ( const p of field ) expect( p.z ).toBeLessThan( 8000 );
    } );

    it( 'advances monotonically down each side', () => {
        for ( const side of [ -1, 1 ] ) {
            const z = zs( side );
            for ( let i = 1; i < z.length; i++ ) expect( z[ i ] ).toBeGreaterThan( z[ i - 1 ] );
        }
    } );

    it( 'packs monoliths tighter through a peak than through a trough', () => {
        const z = zs( -1 );
        const gapNear = ( target: number ) => {
            let best = 0;
            for ( let i = 0; i < z.length - 1; i++ ) {
                if ( Math.abs( z[ i ] - target ) < Math.abs( z[ best ] - target ) ) best = i;
            }
            return z[ best + 1 ] - z[ best ];
        };
        expect( gapNear( 7200 ) ).toBeLessThan( gapNear( 6000 ) );
    } );

    it( 'gives no two monoliths the same silhouette', () => {
        const seen = new Set( field.map( ( p ) => `${ p.scaleW.toFixed( 3 ) }:${ p.scaleH.toFixed( 3 ) }` ) );
        expect( seen.size ).toBeGreaterThan( field.length * 0.9 );
    } );

    it( 'spreads every size axis across its configured range', () => {
        const spread = ( pick: ( z: ( typeof field )[ number ] ) => number, range: { min: number; max: number } ) => {
            const vs = field.map( pick );
            const reach = Math.max( ...vs ) - Math.min( ...vs );
            expect( reach ).toBeGreaterThan( ( range.max - range.min ) * 0.8 );
            for ( const v of vs ) {
                expect( v ).toBeGreaterThanOrEqual( range.min );
                expect( v ).toBeLessThanOrEqual( range.max );
            }
        };
        spread( ( p ) => p.scaleW, config.width );
        spread( ( p ) => p.scaleH, config.height );
        spread( ( p ) => p.scaleD, config.depth );
    } );

    it( 'stands some monoliths back off the rail', () => {
        const pushes = field.map( ( p ) => p.push );
        expect( Math.max( ...pushes ) ).toBeGreaterThan( config.pushMax * 0.8 );
        expect( Math.min( ...pushes ) ).toBeLessThan( config.pushMax * 0.2 );
    } );

    it( 'leaves gaps in the colonnade', () => {
        const dense = monolithField( 8000, { ...config, dropRate: 0 } );
        expect( field.length ).toBeLessThan( dense.length );
    } );

    it( 'is deterministic for a given config', () => {
        expect( monolithField( 8000, config ) ).toEqual( field );
    } );

    it( 'terminates on a degenerate spacing request', () => {
        expect( monolithField( 800, { ...config, spacingCalm: 0, spacingIntense: 0 } ).length ).toBeGreaterThan( 0 );
    } );
} );
