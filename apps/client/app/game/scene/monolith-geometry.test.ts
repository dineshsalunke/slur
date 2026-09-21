import { describe, expect, it } from 'vitest';
import { crossSection, monolithGeometry, monolithProfileGeometry } from './monolith-geometry';

function extent( geometry: ReturnType< typeof monolithProfileGeometry >, axis: 'x' | 'z', top: boolean ): number {
    const position = geometry.attributes.position;
    let max = 0;
    for ( let i = 0; i < position.count; i++ ) {
        if ( top !== position.getY( i ) > 0 ) continue;
        max = Math.max( max, Math.abs( axis === 'x' ? position.getX( i ) : position.getZ( i ) ) );
    }
    return max * 2;
}

describe( 'crossSection', () => {
    it( 'is a square when unchamfered', () => {
        expect( crossSection( 0, 0 ) ).toHaveLength( 4 );
    } );

    it( 'cuts every corner when chamfered', () => {
        const ring = crossSection( 0.1, 0.1 );
        expect( ring ).toHaveLength( 8 );
        for ( const [ x, z ] of ring ) expect( Math.abs( x ) + Math.abs( z ) ).toBeLessThan( 1 );
    } );

    it( 'never eats past the half extent', () => {
        for ( const [ x, z ] of crossSection( 5, 5 ) ) {
            expect( Math.abs( x ) ).toBeLessThanOrEqual( 0.5 );
            expect( Math.abs( z ) ).toBeLessThanOrEqual( 0.5 );
        }
    } );
} );

describe( 'monolithProfileGeometry', () => {
    it( 'is a unit prism when untapered', () => {
        const geometry = monolithProfileGeometry( { taper: 1, chamferX: 0, chamferZ: 0 } );
        expect( extent( geometry, 'x', false ) ).toBeCloseTo( 1 );
        expect( extent( geometry, 'x', true ) ).toBeCloseTo( 1 );
    } );

    it( 'keeps the base and shrinks the top on both axes', () => {
        const geometry = monolithProfileGeometry( { taper: 0.5, chamferX: 0, chamferZ: 0 } );
        expect( extent( geometry, 'x', false ) ).toBeCloseTo( 1 );
        expect( extent( geometry, 'z', false ) ).toBeCloseTo( 1 );
        expect( extent( geometry, 'x', true ) ).toBeCloseTo( 0.5 );
        expect( extent( geometry, 'z', true ) ).toBeCloseTo( 0.5 );
    } );

    it( 'gives a chamfer its own outward-facing quad', () => {
        const plain = monolithProfileGeometry( { taper: 1, chamferX: 0, chamferZ: 0 } );
        const beveled = monolithProfileGeometry( { taper: 1, chamferX: 0.05, chamferZ: 0.05 } );
        expect( beveled.attributes.position.count ).toBeGreaterThan( plain.attributes.position.count );
        expect( extent( beveled, 'x', false ) ).toBeCloseTo( 1 );
    } );

    it( 'points every side normal away from the axis', () => {
        const geometry = monolithProfileGeometry( { taper: 1, chamferX: 0.05, chamferZ: 0.05 } );
        const position = geometry.attributes.position;
        const normal = geometry.attributes.normal;
        for ( let i = 0; i < position.count; i++ ) {
            if ( Math.abs( normal.getY( i ) ) > 0.5 ) continue;
            const radial = position.getX( i ) * normal.getX( i ) + position.getZ( i ) * normal.getZ( i );
            expect( radial ).toBeGreaterThan( 0 );
        }
    } );
} );

describe( 'monolithGeometry', () => {
    it( 'reuses one geometry per profile', () => {
        const profile = { taper: 0.62, chamferX: 0.0375, chamferZ: 0.0375 };
        expect( monolithGeometry( profile ) ).toBe( monolithGeometry( { ...profile } ) );
        expect( monolithGeometry( profile ) ).not.toBe( monolithGeometry( { ...profile, taper: 1 } ) );
    } );
} );
