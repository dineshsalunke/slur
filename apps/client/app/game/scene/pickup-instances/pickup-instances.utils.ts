import type { Anchor } from '@slur/shared';
import * as THREE from 'three';
import { PICKUP_BOB, PICKUP_BOB_HZ, PICKUP_HOVER, PICKUP_POOL_RADIUS, PICKUP_SPIN } from '../combat-look';
import { buildPickupPoolMaterial } from '../pickup-pool-material';
import { pickupPose } from '../pickup-pose';
import type { PickupLife, PickupPart } from './pickup-instances';
import { _o, _pool, _pose, TAU } from './pickup-instances.constants';

export function buildPool(): PickupPart {
    return {
        geometry: new THREE.PlaneGeometry( PICKUP_POOL_RADIUS * 2, PICKUP_POOL_RADIUS * 2 ).rotateX( -Math.PI / 2 ),
        material: buildPickupPoolMaterial(),
    };
}

export function advanceLife( life: PickupLife, i: number, taken: boolean, delta: number ): boolean {
    const gone = taken ? 1 : 0;
    if ( gone !== life.gone[ i ] ) {
        life.gone[ i ] = gone;
        life.since[ i ] = 0;
        life.parked[ i ] = 0;
        return true;
    }
    if ( life.parked[ i ] === 1 ) return false;
    life.since[ i ] += delta;
    return true;
}

export function writeInstance(
    parts: readonly ( THREE.InstancedMesh | null )[],
    pool: THREE.InstancedMesh,
    i: number,
    p: Anchor,
    life: PickupLife,
    t: number,
): void {
    const gone = life.gone[ i ] === 1;
    const { scale: s, lift, spin } = pickupPose( gone, life.since[ i ], _pose );
    if ( gone && s === 0 ) life.parked[ i ] = 1;
    const phase = i * 1.7;
    const bob = Math.sin( t * PICKUP_BOB_HZ * TAU + phase ) * PICKUP_BOB;
    _o.position.set( p.x, p.y + PICKUP_HOVER + bob + lift, p.z );
    _o.rotation.set( 0, t * PICKUP_SPIN + phase + spin, 0 );
    _o.scale.setScalar( s );
    _o.updateMatrix();
    for ( const m of parts ) m?.setMatrixAt( i, _o.matrix );
    _pool.position.set( p.x, p.y + 0.03, p.z );
    _pool.scale.setScalar( s );
    _pool.updateMatrix();
    pool.setMatrixAt( i, _pool.matrix );
}

export function markUploaded( parts: readonly ( THREE.InstancedMesh | null )[], pool: THREE.InstancedMesh ): void {
    for ( const m of parts ) if ( m ) m.instanceMatrix.needsUpdate = true;
    pool.instanceMatrix.needsUpdate = true;
}
