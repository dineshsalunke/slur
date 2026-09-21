import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DEEP_SPACE, skyDirection } from './sky-config';

const R3F_DEFAULT_FAR = 1000;

function chaseCamera(): THREE.PerspectiveCamera {
    const cam = new THREE.PerspectiveCamera( 60, 16 / 9, 0.1, R3F_DEFAULT_FAR );
    cam.position.set( 0, 9, -11 );
    cam.lookAt( 0, 2, 7 );
    cam.updateMatrixWorld( true );
    return cam;
}

function project( bearingDeg: number, elevationDeg: number ): THREE.Vector3 {
    const [ x, y, z ] = skyDirection( bearingDeg, elevationDeg );
    return new THREE.Vector3( x, y, z ).multiplyScalar( DEEP_SPACE.radius ).project( chaseCamera() );
}

describe( 'skyDirection', () => {
    it( 'returns unit vectors', () => {
        for ( const [ b, e ] of [
            [ 0, 0 ],
            [ 66, 19 ],
            [ -140, -35 ],
            [ 180, 80 ],
        ] ) {
            const [ x, y, z ] = skyDirection( b, e );
            expect( Math.hypot( x, y, z ) ).toBeCloseTo( 1, 12 );
        }
    } );

    it( 'puts bearing 0 straight down the track (+Z, the way the ship flies)', () => {
        const [ x, y, z ] = skyDirection( 0, 0 );
        expect( x ).toBeCloseTo( 0, 12 );
        expect( y ).toBeCloseTo( 0, 12 );
        expect( z ).toBeCloseTo( 1, 12 );
        expect( project( 0, 0 ).x ).toBeCloseTo( 0, 6 );
    } );

    it( 'grows bearing toward SCREEN-right, which is world −X', () => {
        expect( skyDirection( 90, 0 )[ 0 ] ).toBeCloseTo( -1, 12 );
        expect( project( 30, 0 ).x ).toBeGreaterThan( 0 );
        expect( project( -30, 0 ).x ).toBeLessThan( 0 );
    } );

    it( 'grows elevation toward the top of the frame', () => {
        expect( skyDirection( 0, 90 )[ 1 ] ).toBeCloseTo( 1, 12 );
        expect( project( 0, 25 ).y ).toBeGreaterThan( project( 0, 5 ).y );
    } );
} );

const STRAFE_LAG_U = 80 / 16;
const LOOK_DISTANCE_U = 14 + 7;

const IMAGE_ASPECT = 1672 / 941;
const CANVAS_ASPECT = 3456 / 1926;

const toRad = ( d: number ): number => ( d * Math.PI ) / 180;

function frameHalfWidthDeg( vFovDeg: number ): number {
    return ( Math.atan( Math.tan( toRad( vFovDeg / 2 ) ) * CANVAS_ASPECT ) * 180 ) / Math.PI;
}

describe( 'DEEP_SPACE', () => {
    it( 'puts the star up and to the right, where the reference image implies it', () => {
        const star = project( DEEP_SPACE.starBearingDeg, DEEP_SPACE.starElevationDeg );
        expect( star.x ).toBeGreaterThan( 0 );
        expect( star.y ).toBeGreaterThan( 0 );
    } );

    it( 'keeps the backdrop inside the far plane R3F actually builds', () => {
        expect( DEEP_SPACE.radius ).toBeLessThan( R3F_DEFAULT_FAR );
    } );

    it( 'keeps the star shell inside the backdrop patch', () => {
        expect( DEEP_SPACE.stars.radius + DEEP_SPACE.stars.depth ).toBeLessThan( DEEP_SPACE.radius );
    } );

    const ACCEPTED_EDGE_MARGIN = 0.12;

    it( 'keeps the patch able to reach full opacity', () => {
        const fovVDeg = DEEP_SPACE.backdrop.fovDeg / IMAGE_ASPECT;
        expect( fovVDeg ).toBeGreaterThan( 2 * DEEP_SPACE.backdrop.edgeFadeDeg );
    } );

    it( 'keeps the worst-case black margin inside the accepted budget', () => {
        const halfDeg = frameHalfWidthDeg( 75 );
        const yawDeg = ( Math.atan( STRAFE_LAG_U / LOOK_DISTANCE_U ) * 180 ) / Math.PI;
        const edgeOffAxisDeg = DEEP_SPACE.backdrop.fovDeg / 2 - yawDeg;
        const uncovered =
            edgeOffAxisDeg >= halfDeg
                ? 0
                : 0.5 - 0.5 * ( Math.tan( toRad( edgeOffAxisDeg ) ) / Math.tan( toRad( halfDeg ) ) );
        expect( uncovered ).toBeLessThanOrEqual( ACCEPTED_EDGE_MARGIN );
    } );

    it( 'covers the frame completely when the camera is not strafing', () => {
        expect( DEEP_SPACE.backdrop.fovDeg / 2 ).toBeGreaterThan( frameHalfWidthDeg( 75 ) );
    } );
} );
