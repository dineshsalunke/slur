import { describe, expect, it } from 'vitest';
import { buildExhaustGeometry, slotProfile } from './exhaust-geometry';
import { PORT_HEIGHT, PORT_WIDTH } from './exhaust-ports';

describe( 'slotProfile', () => {
    it( 'is full width at the nozzle', () => {
        expect( slotProfile( 0 ) ).toBeCloseTo( 1, 5 );
    } );

    it( 'never collapses to a degenerate ring', () => {
        expect( slotProfile( 1 ) ).toBeGreaterThan( 0 );
    } );

    it( 'holds most of its width through the first half', () => {
        expect( slotProfile( 0.5 ) ).toBeGreaterThan( 0.8 );
    } );

    it( 'is thinner at the tip than at the nozzle', () => {
        expect( slotProfile( 1 ) ).toBeLessThan( slotProfile( 0.5 ) );
    } );
} );

describe( 'buildExhaustGeometry', () => {
    const geometry = buildExhaustGeometry( PORT_WIDTH, PORT_HEIGHT );

    it( 'carries an axial attribute spanning the whole plume', () => {
        const axial = geometry.getAttribute( 'aAxial' );
        expect( Math.min( ...axial.array ) ).toBe( 0 );
        expect( Math.max( ...axial.array ) ).toBe( 1 );
    } );

    it( 'extends one unit along -z so instance stretch sets the length', () => {
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        expect( box?.max.z ).toBeCloseTo( 0, 5 );
        expect( box?.min.z ).toBeCloseTo( -1, 5 );
    } );

    it( 'opens at the authored port cross-section', () => {
        const position = geometry.getAttribute( 'position' );
        let widest = 0;
        let tallest = 0;
        for ( let v = 0; v < position.count; v++ ) {
            if ( position.getZ( v ) !== 0 ) continue;
            widest = Math.max( widest, Math.abs( position.getX( v ) ) );
            tallest = Math.max( tallest, Math.abs( position.getY( v ) ) );
        }
        expect( widest * 2 ).toBeCloseTo( PORT_WIDTH, 5 );
        expect( tallest * 2 ).toBeCloseTo( PORT_HEIGHT, 5 );
    } );

    it( 'flares wider than the port before it tapers', () => {
        geometry.computeBoundingBox();
        expect( ( geometry.boundingBox?.max.x ?? 0 ) * 2 ).toBeGreaterThan( PORT_WIDTH );
    } );

    it( 'produces finite normals everywhere', () => {
        const normals = geometry.getAttribute( 'normal' ).array;
        expect( [ ...normals ].every( Number.isFinite ) ).toBe( true );
    } );
} );
