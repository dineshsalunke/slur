import { useFrame } from '@react-three/fiber';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LocalPlayer, Render } from '../ecs/traits';
import { ACCENT_ANCHOR } from './accent';
import { isDead } from './ship-dead';
import {
    advanceShards,
    initShardMesh,
    makeShardPool,
    type Shard,
    type ShardPool,
    type ShardSpec,
    spawnBurst,
} from './vfx-shard-pool';

const SPEC: ShardSpec = {
    max: 240,
    perBurst: 40,
    lifeMin: 0.5,
    lifeMax: 0.95,
    speed: 16,
    upBias: 6,
    drag: 2.2,
    grav: 18,
};
const SIZE = 0.16;
const BRIGHT = 2.6;

const _o = new THREE.Object3D();
const _c = new THREE.Color();
const LOCAL_CORE = new THREE.Color( '#FFFBE7' );
const REMOTE_CORE = new THREE.Color( '#FFB52E' );
const MARIGOLD = new THREE.Color( ACCENT_ANCHOR );

function detectDeaths( world: World, pool: ShardPool, wasDead: Map< number, boolean > ): void {
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

function placeShard( mesh: THREE.InstancedMesh, i: number, p: Shard, f: number ): void {
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

export function ExplosionField() {
    const world = useWorld();
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const pool = useMemo( () => makeShardPool( SPEC ), [] );
    const wasDead = useMemo( () => new Map< number, boolean >(), [] );

    const setMesh = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            meshRef.current = mesh;
            if ( mesh ) initShardMesh( mesh, pool );
        },
        [ pool ],
    );

    useFrame( ( _state, delta ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        detectDeaths( world, pool, wasDead );
        advanceShards( pool, mesh, delta, placeShard );
    } );

    return (
        <instancedMesh ref={ setMesh } frustumCulled={ false } args={ [ undefined, undefined, SPEC.max ] }>
            <boxGeometry args={ [ 1, 1, 1 ] } />
            <meshBasicMaterial transparent depthWrite={ false } blending={ THREE.AdditiveBlending } />
        </instancedMesh>
    );
}
