import { createWorld } from 'koota';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { LocalPlayer, Render } from '../ecs/traits';
import { updateRearCamera } from './rear-view-camera';

function cameraOf(): THREE.PerspectiveCamera {
    return new THREE.PerspectiveCamera( 0, 3.2, 1, 1000 );
}

describe( 'rear camera', () => {
    it( 'reports no placement without a local player', () => {
        expect( updateRearCamera( cameraOf(), createWorld() ) ).toBe( false );
    } );

    it( 'sits above the ship and faces back down the track', () => {
        const world = createWorld();
        const group = new THREE.Group();
        group.position.set( 7, 2, 400 );
        world.spawn( LocalPlayer, Render( group ) );

        const cam = cameraOf();
        expect( updateRearCamera( cam, world ) ).toBe( true );

        expect( cam.position.x ).toBe( 7 );
        expect( cam.position.z ).toBe( 400 );
        expect( cam.position.y ).toBeGreaterThan( 2 );
        expect( cam.fov ).toBeGreaterThan( 0 );

        const forward = cam.getWorldDirection( new THREE.Vector3() );
        expect( forward.z ).toBeLessThan( -0.9 );
        expect( forward.x ).toBeCloseTo( 0 );
        expect( forward.y ).toBeLessThan( 0 );
    } );

    it( 'keeps the vertical field of view narrow enough for the letterbox panel', () => {
        const world = createWorld();
        world.spawn( LocalPlayer, Render( new THREE.Group() ) );

        const cam = cameraOf();
        updateRearCamera( cam, world );

        const horizontal = 2 * Math.atan( 3.2 * Math.tan( THREE.MathUtils.degToRad( cam.fov ) / 2 ) );
        expect( THREE.MathUtils.radToDeg( horizontal ) ).toBeLessThan( 110 );
    } );
} );
