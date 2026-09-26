import { DEFAULT_PORTAL_CONFIG, type PortalState } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { GATE_RING, PORTAL_ARMED_INTENSITY, PORTAL_IDLE_INTENSITY } from './portal-field.constants';
import { collectPortalEnds, gateShellGeometry, portalGlow } from './portal-field.utils';

function portal( over: Partial< PortalState > ): PortalState {
    return { ax: 1, ay: 0, az: 10, bx: -2, by: 1, bz: 40, ends: 2, armA: true, armB: true, ...over };
}

function collect( portals: PortalState[] ) {
    const out: { x: number; y: number; z: number; live: boolean; marks: number }[] = [];
    collectPortalEnds( portals, ( x, y, z, live, marks ) => out.push( { x, y, z, live, marks } ) );
    return out;
}

describe( 'collectPortalEnds', () => {
    it( 'draws a lone end dim with one mark, even when it is armed', () => {
        expect( collect( [ portal( { ends: 1 } ) ] ) ).toEqual( [ { x: 1, y: 0, z: 10, live: false, marks: 1 } ] );
    } );

    it( 'draws both ends of a pair, each lit by its own arm flag, B with two marks', () => {
        expect( collect( [ portal( { armB: false } ) ] ) ).toEqual( [
            { x: 1, y: 0, z: 10, live: true, marks: 1 },
            { x: -2, y: 1, z: 40, live: false, marks: 2 },
        ] );
    } );

    it( 'draws nothing for a portal with no ends', () => {
        expect( collect( [ portal( { ends: 0 } ) ] ) ).toEqual( [] );
    } );
} );

describe( 'gateShellGeometry', () => {
    it( 'opens an aperture of the sim portal radius and stands on the deck', () => {
        expect( GATE_RING.inner ).toBe( DEFAULT_PORTAL_CONFIG.portalR );
        const g = gateShellGeometry();
        g.computeBoundingBox();
        const box = g.boundingBox;
        expect( box?.min.y ).toBeLessThanOrEqual( 0 );
        expect( box?.max.x ).toBeCloseTo( GATE_RING.outer, 2 );
    } );
} );

describe( 'portalGlow', () => {
    it( 'holds an idle end at the idle intensity and pulses a live end below the armed peak', () => {
        expect( portalGlow( false, 0.3 ) ).toBe( PORTAL_IDLE_INTENSITY );
        for ( const t of [ 0, 0.1, 0.2, 0.37 ] ) {
            const g = portalGlow( true, t );
            expect( g ).toBeLessThanOrEqual( PORTAL_ARMED_INTENSITY );
            expect( g ).toBeGreaterThan( PORTAL_IDLE_INTENSITY );
        }
    } );
} );
