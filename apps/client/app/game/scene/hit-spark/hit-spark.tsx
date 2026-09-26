import { useFrame } from '@react-three/fiber';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { drainHits, type HitEvent } from '../hit-events';
import { advanceShards, initShardMesh, makeShardPool, spawnBurst } from '../vfx-shard-pool';
import { _o, SPEC } from './hit-spark.constants';
import { placeStreak } from './hit-spark.utils';

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
