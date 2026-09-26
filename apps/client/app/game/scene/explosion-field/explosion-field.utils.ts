import type { World } from 'koota';
import type * as THREE from 'three';
import { LocalPlayer, Render } from '../../ecs/traits';
import { isDead } from '../ship-dead';
import { type Shard, type ShardPool, spawnBurst } from '../vfx-shard-pool';
import { _c, _o, BRIGHT, LOCAL_CORE, MARIGOLD, REMOTE_CORE, SIZE } from './explosion-field.constants';

export function detectDeaths( world: World, pool: ShardPool, wasDead: Map< number, boolean > ): void {
    for ( const e of world.query( Render ) ) {
        const grp = e.get( Render );
        if ( ! grp ) continue;
        const dead = isDead( e );
        const id = e.id();
        if ( dead && ! wasDead.get( id ) ) {
            spawnBurst(
                pool,
                grp.position.x,
                grp.position.y,
                grp.position.z,
                e.has( LocalPlayer ) ? LOCAL_CORE : REMOTE_CORE,
            );
        }
        wasDead.set( id, dead );
    }
}

export function placeShard( mesh: THREE.InstancedMesh, i: number, p: Shard, f: number ): void {
    const s = SIZE * ( 0.35 + 0.75 * f );
    _o.position.set( p.x, p.y, p.z );
    _o.scale.set( s, s, s );
    _o.updateMatrix();
    mesh.setMatrixAt( i, _o.matrix );
    const b = BRIGHT * f * f;
    mesh.setColorAt(
        i,
        _c
            .setRGB( p.r, p.g, p.b )
            .lerp( MARIGOLD, 1 - f )
            .multiplyScalar( b ),
    );
}
