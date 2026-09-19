import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DEEP_SPACE, skyDirection } from './sky-config';

/**
 * The chase camera, reproduced from `camera/chase.ts` at rest: 9u above the ship, 11u behind, aiming 7u ahead
 * and 2u up. Built with real three rather than by hand because the sign this file exists to pin — that
 * SCREEN-right is world −X when you fly toward +Z — is exactly the kind of thing that is easy to reason
 * confidently and wrongly about. Asking three where a point lands on screen cannot be reasoned wrongly.
 */
function chaseCamera(): THREE.PerspectiveCamera {
    const cam = new THREE.PerspectiveCamera( 60, 16 / 9, 0.1, 2000 );
    cam.position.set( 0, 9, -11 );
    cam.lookAt( 0, 2, 7 );
    cam.updateMatrixWorld( true );
    return cam;
}

/** Where a sky bearing/elevation lands in normalised device coords: x>0 is right of frame, y>0 is up. */
function project( bearingDeg: number, elevationDeg: number ): THREE.Vector3 {
    const [ x, y, z ] = skyDirection( bearingDeg, elevationDeg );
    return new THREE.Vector3( x, y, z ).multiplyScalar( 1000 ).project( chaseCamera() );
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
        // ...and it lands in the middle of the frame horizontally.
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

describe( 'DEEP_SPACE', () => {
    it( 'puts the star up and to the right, where the reference image implies it', () => {
        const star = project( DEEP_SPACE.starBearingDeg, DEEP_SPACE.starElevationDeg );
        expect( star.x ).toBeGreaterThan( 0 );
        expect( star.y ).toBeGreaterThan( 0 );
    } );

    it( 'keeps the backdrop inside three’s default far plane', () => {
        expect( DEEP_SPACE.radius ).toBeLessThan( 2000 );
    } );

    it( 'hangs the backdrop wide enough to cover the top-speed frame', () => {
        // vFOV 75 (60 + fovStretch 15) at 16:9 → a horizontal half-angle of atan(tan(37.5°)·16/9).
        const halfDeg = ( Math.atan( Math.tan( ( 37.5 * Math.PI ) / 180 ) * ( 16 / 9 ) ) * 180 ) / Math.PI;
        expect( DEEP_SPACE.backdrop.fovDeg ).toBeGreaterThan( 2 * halfDeg );
    } );
} );
