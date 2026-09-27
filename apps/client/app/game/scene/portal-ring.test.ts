import { describe, expect, it } from 'vitest';
import { dashedSleeveGeometry, type RingSpec, ringGeometry, ringSleeveGeometry, wedgeGeometry } from './portal-ring';

const SPEC: RingSpec = { inner: 3, outer: 3.9, depth: 1.2, wedges: 24, seam: 0.06, bevel: 0.08 };

function radii( g: ReturnType< typeof ringGeometry > ) {
    const p = g.getAttribute( 'position' );
    let min = Infinity;
    let max = 0;
    let zMin = Infinity;
    let zMax = -Infinity;
    for ( let i = 0; i < p.count; i++ ) {
        const r = Math.hypot( p.getX( i ), p.getY( i ) );
        min = Math.min( min, r );
        max = Math.max( max, r );
        zMin = Math.min( zMin, p.getZ( i ) );
        zMax = Math.max( zMax, p.getZ( i ) );
    }
    return { min, max, zMin, zMax };
}

describe( 'ringGeometry', () => {
    it( 'keeps the bevelled rim inside the inner and outer radius and the depth', () => {
        const r = radii( ringGeometry( SPEC ) );
        expect( r.min ).toBeGreaterThanOrEqual( SPEC.inner - 0.01 );
        expect( r.min ).toBeLessThan( SPEC.inner + 0.05 );
        expect( r.max ).toBeLessThanOrEqual( SPEC.outer + 0.01 );
        expect( r.zMin ).toBeCloseTo( -SPEC.depth / 2, 3 );
        expect( r.zMax ).toBeCloseTo( SPEC.depth / 2, 3 );
    } );

    it( 'is one wedge repeated once per wedge', () => {
        const one = wedgeGeometry( SPEC ).getAttribute( 'position' ).count;
        expect( ringGeometry( SPEC ).getAttribute( 'position' ).count ).toBe( one * SPEC.wedges );
    } );

    it( 'leaves a seam between neighbouring wedges', () => {
        const p = wedgeGeometry( SPEC ).getAttribute( 'position' );
        let widest = 0;
        for ( let i = 0; i < p.count; i++ )
            widest = Math.max( widest, Math.abs( Math.atan2( p.getY( i ), p.getX( i ) ) ) );
        expect( widest ).toBeLessThan( Math.PI / SPEC.wedges );
    } );
} );

describe( 'sleeves', () => {
    const sleeve = { inset: 0.06, reach: 0.2, proud: 0.02 };

    it( 'lines the whole ring aperture proud of both faces', () => {
        const r = radii( ringSleeveGeometry( SPEC, sleeve ) );
        expect( r.min ).toBeCloseTo( SPEC.inner - sleeve.inset, 2 );
        expect( r.max ).toBeCloseTo( SPEC.inner + sleeve.reach, 2 );
        expect( r.zMax ).toBeCloseTo( SPEC.depth / 2 + sleeve.proud, 3 );
    } );

    it( 'draws one dash per wedge', () => {
        const all = dashedSleeveGeometry( SPEC, sleeve, 0.5 ).getAttribute( 'position' ).count;
        expect( all % SPEC.wedges ).toBe( 0 );
    } );
} );
