import { useFrame } from '@react-three/fiber';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ACCENT_ANCHOR } from './accent';
import { drainHits, type HitEvent } from './hit-events';
import { advanceShards, initShardMesh, makeShardPool, type Shard, type ShardSpec, spawnBurst } from './vfx-shard-pool';

const SPEC: ShardSpec = {
    max: 200,
    perBurst: 22,
    lifeMin: 0.18,
    lifeMax: 0.4,
    speed: 22,
    upBias: 2,
    drag: 4,
    grav: 12,
};
const WIDTH = 0.07;
const STREAK_S = 0.035;
const BRIGHT = 6;

const _o = new THREE.Object3D();
const _c = new THREE.Color();
const _dir = new THREE.Vector3();
const FORWARD = new THREE.Vector3( 0, 0, 1 );
const ENERGY_CORE = new THREE.Color( '#FFFBE7' );
const SPARK = new THREE.Color( ACCENT_ANCHOR );

function placeStreak( mesh: THREE.InstancedMesh, i: number, p: Shard, f: number ): void {
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

export function HitSpark() {
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const pool = useMemo( () => makeShardPool( SPEC ), [] );
    const onHit = useMemo( () => ( e: HitEvent ) => spawnBurst( pool, e.x, e.y, e.z ), [ pool ] );

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
        drainHits( onHit );
        advanceShards( pool, mesh, delta, placeStreak );
        _o.quaternion.identity();
    } );

    return (
        <instancedMesh ref={ setMesh } frustumCulled={ false } args={ [ undefined, undefined, SPEC.max ] }>
            <boxGeometry args={ [ 1, 1, 1 ] } />
            <meshBasicMaterial transparent depthWrite={ false } blending={ THREE.AdditiveBlending } />
        </instancedMesh>
    );
}
