import type * as THREE from 'three';
import type { Shard } from '../vfx-shard-pool';
import { _c, _dir, _o, BRIGHT, ENERGY_CORE, FORWARD, SPARK, STREAK_S, WIDTH } from './hit-spark.constants';

export function placeStreak( mesh: THREE.InstancedMesh, i: number, p: Shard, f: number ): void {
    _dir.set( p.vx, p.vy, p.vz );
    const speed = _dir.length();
    if ( speed > 1e-4 ) _o.quaternion.setFromUnitVectors( FORWARD, _dir.divideScalar( speed ) );
    const w = WIDTH * ( 0.5 + 0.5 * f );
    const len = Math.max( w, speed * STREAK_S );
    _o.position.set( p.x, p.y, p.z ).addScaledVector( _dir, -0.5 * len );
    _o.scale.set( w, w, len );
    _o.updateMatrix();
    mesh.setMatrixAt( i, _o.matrix );
    const b = BRIGHT * f * f;
    mesh.setColorAt(
        i,
        _c
            .copy( ENERGY_CORE )
            .lerp( SPARK, 1 - f )
            .multiplyScalar( b ),
    );
}
