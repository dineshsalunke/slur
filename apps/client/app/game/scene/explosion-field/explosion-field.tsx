import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { advanceShards, initShardMesh, makeShardPool } from '../vfx-shard-pool';
import { SPEC } from './explosion-field.constants';
import { detectDeaths, placeShard } from './explosion-field.utils';

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
