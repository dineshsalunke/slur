import type { TugEvent } from '@slur/shared';
import type { World } from 'koota';
import type * as THREE from 'three';
import { Net, Render } from '../../ecs/traits';
import { accent } from '../accent';
import type { Tether } from './tug-line';
import { _c, _from, _o, _to, BRIGHT, FADE_S, HOLD_S, LIFT, MAX, RADIUS } from './tug-line.constants';

export function spawnTether( tethers: Tether[], e: TugEvent ): void {
    if ( tethers.length >= MAX ) tethers.shift();
    tethers.push( { ownerId: e.ownerId, targetId: e.targetId, x: e.x, y: e.y, z: e.z, age: 0 } );
}

export function shipPosition( world: World, sessionId: string, out: THREE.Vector3 ): boolean {
    for ( const e of world.query( Net, Render ) ) {
        if ( e.get( Net )?.sessionId !== sessionId ) continue;
        const g = e.get( Render );
        if ( ! g ) return false;
        out.copy( g.position );
        out.y += LIFT;
        return true;
    }
    return false;
}

export function tetherFade( age: number ): number {
    if ( age <= HOLD_S ) return 1;
    const f = 1 - ( age - HOLD_S ) / FADE_S;
    return Math.max( 0, f * f );
}

export function tetherDone( t: Tether ): boolean {
    return t.age >= HOLD_S + FADE_S;
}

export function placeTether( world: World, mesh: THREE.InstancedMesh, i: number, t: Tether ): boolean {
    if ( ! shipPosition( world, t.ownerId, _from ) ) return false;
    if ( t.targetId === '' || ! shipPosition( world, t.targetId, _to ) ) _to.set( t.x, t.y, t.z );
    const len = _from.distanceTo( _to );
    if ( len < 1e-3 ) return false;
    const f = tetherFade( t.age );
    const r = RADIUS * ( 0.4 + 0.6 * f );
    _o.position.copy( _from ).lerp( _to, 0.5 );
    _o.lookAt( _to );
    _o.scale.set( r, r, len );
    _o.updateMatrix();
    mesh.setMatrixAt( i, _o.matrix );
    mesh.setColorAt( i, _c.copy( accent() ).multiplyScalar( BRIGHT * f ) );
    return true;
}
