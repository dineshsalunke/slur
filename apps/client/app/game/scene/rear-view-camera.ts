import type { World } from 'koota';
import type { PerspectiveCamera } from 'three';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { LocalPlayer, Render } from '../ecs/traits';

const REAR_LOOK = 60;

export function updateRearCamera( cam: PerspectiveCamera, world: World ): boolean {
    const e = world.queryFirst( LocalPlayer, Render );
    if ( ! e ) return false;
    const grp = e.get( Render );
    if ( ! grp ) return false;

    const p = grp.position;
    const lift = num( 'RearView.lift' );
    const drop = REAR_LOOK * Math.tan( THREE.MathUtils.degToRad( num( 'RearView.tilt' ) ) );

    cam.position.set( p.x, p.y + lift, p.z );
    cam.lookAt( p.x, p.y + lift - drop, p.z - REAR_LOOK );

    const fov = num( 'RearView.fov' );
    if ( Math.abs( cam.fov - fov ) > 0.1 ) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
    }
    return true;
}
