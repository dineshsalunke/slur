import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DEEP_SPACE, skyDirection } from './sky-config';

/**
 * The chase camera, reproduced from `camera/chase.ts` at rest: 9u above the ship, 11u behind, aiming 7u ahead
 * and 2u up. Built with real three rather than by hand because the sign this file exists to pin — that
 * SCREEN-right is world −X when you fly toward +Z — is exactly the kind of thing that is easy to reason
 * confidently and wrongly about. Asking three where a point lands on screen cannot be reasoned wrongly.
 */
/**
 * R3F does NOT use three's camera defaults. `<Canvas>` builds its own —
 * `new THREE.PerspectiveCamera( 75, 0, 0.1, 1000 )`, @react-three/fiber@9.7.0 dist/events-156d8d12.esm.js:15771
 * — and a `camera={{ … }}` prop overrides only the fields it names. No Canvas in this app names `far`, so
 * three's 2000 is not in play anywhere; believing it was is what put the sky beyond the far plane.
 */
const R3F_DEFAULT_FAR = 1000;

function chaseCamera(): THREE.PerspectiveCamera {
    const cam = new THREE.PerspectiveCamera( 60, 16 / 9, 0.1, R3F_DEFAULT_FAR );
    cam.position.set( 0, 9, -11 );
    cam.lookAt( 0, 2, 7 );
    cam.updateMatrixWorld( true );
    return cam;
}

/** Where a sky bearing/elevation lands in normalised device coords: x>0 is right of frame, y>0 is up. */
function project( bearingDeg: number, elevationDeg: number ): THREE.Vector3 {
    const [ x, y, z ] = skyDirection( bearingDeg, elevationDeg );
    // At the patch's own radius, which is inside the far plane — 1000 sat exactly ON it.
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

// Worst-case chase-cam yaw, from camera/chase.ts + constants.ts. Sustained max strafe lags the rubberband
// by strafeClamp/follow = 80/16 units, at a look distance of back(→14 at speed) + lookAhead(7).
const STRAFE_LAG_U = 80 / 16;
const LOOK_DISTANCE_U = 14 + 7;

/** The backdrop jpg is 1672×941; the patch's vertical extent follows from it rather than being authored. */
const IMAGE_ASPECT = 1672 / 941;
/** The live canvas measured 3456×1926 in `/art-lab`, which is what the margin was calibrated against. */
const CANVAS_ASPECT = 3456 / 1926;

const toRad = ( d: number ): number => ( d * Math.PI ) / 180;

/** Horizontal half-angle of the frame for a given vertical fov. */
function frameHalfWidthDeg( vFovDeg: number ): number {
    return ( Math.atan( Math.tan( toRad( vFovDeg / 2 ) ) * CANVAS_ASPECT ) * 180 ) / Math.PI;
}

describe( 'DEEP_SPACE', () => {
    it( 'puts the star up and to the right, where the reference image implies it', () => {
        const star = project( DEEP_SPACE.starBearingDeg, DEEP_SPACE.starElevationDeg );
        expect( star.x ).toBeGreaterThan( 0 );
        expect( star.y ).toBeGreaterThan( 0 );
    } );

    // Every point of a camera-locked patch is equidistant, so the far plane clips on view-space DEPTH:
    // radius·cos(angle off axis) > far. At angle 0 that reduces to radius > far, so a radius under `far` is
    // unclippable at every angle by construction. radius 1200 against far 1000 punched an
    // acos( 1000 / 1200 ) = 33.6° hole through the middle of every frame — in the game, not just the labs.
    it( 'keeps the backdrop inside the far plane R3F actually builds', () => {
        expect( DEEP_SPACE.radius ).toBeLessThan( R3F_DEFAULT_FAR );
    } );

    it( 'keeps the star shell inside the backdrop patch', () => {
        // drei spans the shell OUTWARD from `radius`: `let r = radius + depth` (drei 10.7.8, core/Stars.js:65).
        expect( DEEP_SPACE.stars.radius + DEEP_SPACE.stars.depth ).toBeLessThan( DEEP_SPACE.radius );
    } );

    // The patch deliberately does NOT cover the frame — it is a framed feature, and under sustained max
    // strafe a sliver of the leading edge goes black. This is the budget for that sliver, as a fraction of
    // frame WIDTH. Raising it is an art decision, not a fix.
    const ACCEPTED_EDGE_MARGIN = 0.12;

    it( 'keeps the patch able to reach full opacity', () => {
        // makeEdgeFade's vertical fade fraction is edgeFadeDeg/fovVDeg and its du=min(v,1-v) peaks at 0.5,
        // so once fovV ≤ 2·edgeFadeDeg every texel is part-transparent and the image never reads at full
        // strength anywhere. Both fov sliders floor at 43 for this reason.
        const fovVDeg = DEEP_SPACE.backdrop.fovDeg / IMAGE_ASPECT;
        expect( fovVDeg ).toBeGreaterThan( 2 * DEEP_SPACE.backdrop.edgeFadeDeg );
    } );

    it( 'keeps the worst-case black margin inside the accepted budget', () => {
        // REPLACES an assertion that read `fovDeg > 2·halfDeg + 2·yawDeg` — "the patch must fill the frame".
        // That premise is now false by owner decision, and an assertion built on a false premise is an
        // active source of false confidence, not a weak guard (the far-plane test proved that the hard way).
        // So this pins what is actually true: the margin exists, and it is THIS big.
        //
        // Angle → screen width is NOT linear: width per degree grows as sec²θ, so a shortfall at the frame
        // EDGE buys more width than the same angle at centre. Dividing the uncovered angle by the frame
        // angle under-reports it (7.4°/107.5° reads as 7%; the real answer is 11.6%).
        //
        // Calibrated against pixels at fovDeg 70 (patch-visible differenced against patch-hidden, live):
        // predicted 0.162/0.246/0.356 against measured 0.154/~0.21/0.333. The model runs 1–2% of width
        // CONSERVATIVE, which is the safe direction.
        const halfDeg = frameHalfWidthDeg( 75 ); // top speed: fov 60 + fovStretch 15
        const yawDeg = ( Math.atan( STRAFE_LAG_U / LOOK_DISTANCE_U ) * 180 ) / Math.PI;
        // Patch edge on the leading side, as an angle off the camera axis once the rubberband has lagged.
        const edgeOffAxisDeg = DEEP_SPACE.backdrop.fovDeg / 2 - yawDeg;
        const uncovered =
            edgeOffAxisDeg >= halfDeg
                ? 0
                : 0.5 - 0.5 * ( Math.tan( toRad( edgeOffAxisDeg ) ) / Math.tan( toRad( halfDeg ) ) );
        expect( uncovered ).toBeLessThanOrEqual( ACCEPTED_EDGE_MARGIN );
    } );

    it( 'covers the frame completely when the camera is not strafing', () => {
        // The margin is a STRAFE artefact and nothing else. If it ever appears parked or running straight,
        // the framing has drifted and the accepted budget above no longer describes what ships.
        expect( DEEP_SPACE.backdrop.fovDeg / 2 ).toBeGreaterThan( frameHalfWidthDeg( 75 ) );
    } );
} );
