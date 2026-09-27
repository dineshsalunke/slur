import { DEFAULT_PORTAL_CONFIG, type PortalState, portalHalfChord } from '@slur/shared';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GATE_RING, PORTAL_ARMED_INTENSITY, PORTAL_IDLE_INTENSITY } from './portal-field.constants';
import { collectPortalEnds, gateShellGeometry, gateSleeveGeometry, portalGlow } from './portal-field.utils';

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

describe( 'gate aperture', () => {
    const { portalR, portalY } = DEFAULT_PORTAL_CONFIG;
    const mat = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide } );
    const meshes = [ new THREE.Mesh( gateShellGeometry(), mat ), new THREE.Mesh( gateSleeveGeometry(), mat ) ];
    const ray = new THREE.Raycaster();

    function edge( y: number, dir: number ): number {
        ray.set( new THREE.Vector3( 0, y, 0 ), new THREE.Vector3( dir, 0, 0 ) );
        return ray.intersectObjects( meshes )[ 0 ]?.point.x ?? Number.NaN;
    }

    it( 'is the catch chord at every ship height', () => {
        for ( const y of [ 0.35, 0.8, 1.25, 2, portalY, 5 ] ) {
            const width = edge( y, 1 ) - edge( y, -1 );
            const chord = 2 * portalHalfChord( y - portalY );
            expect( width ).toBeLessThanOrEqual( chord + 0.01 );
            expect( width ).toBeGreaterThan( chord - 0.2 );
        }
    } );

    it( 'is a full ring sunk into the deck that closes at the top of the catch', () => {
        expect( portalY - portalR ).toBeLessThan( 0 );
        expect( portalY ).toBeGreaterThan( 0 );
        const up = new THREE.Raycaster( new THREE.Vector3( 0, portalY, 0 ), new THREE.Vector3( 0, 1, 0 ) );
        expect( up.intersectObjects( meshes )[ 0 ]?.point.y ).toBeCloseTo( portalY + portalR, 1 );
        const down = new THREE.Raycaster( new THREE.Vector3( 0, portalY, 0 ), new THREE.Vector3( 0, -1, 0 ) );
        expect( down.intersectObjects( meshes )[ 0 ]?.point.y ).toBeCloseTo( portalY - portalR, 1 );
        const g = gateShellGeometry();
        g.computeBoundingBox();
        expect( g.boundingBox?.min.y ).toBeCloseTo( portalY - GATE_RING.outer, 1 );
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
