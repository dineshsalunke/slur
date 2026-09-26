import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { blockWorld } from '../../block-state';
import { useTrack } from '../../track-context/use-track';
import { asteroidGeometry } from '../asteroid-geometry';
import { trackGround } from '../debris-ground';
import { type DebrisBody, makeBody } from '../debris-physics';
import { beginTick, moveBody, sparkOnLanding } from '../debris-tick';
import { rockHull } from '../meteor-assets';
import {
    _m,
    _tick,
    _zero,
    CHUNK_DETAIL,
    CHUNK_SEED,
    HEAT_SHARE,
    LIFE,
    LIMIT,
    SPARK_SLAM,
} from './meteor-chunks.constants';
import { spawnPending } from './meteor-chunks.utils';

export interface ChunkBurst {
    x: number;
    y: number;
    z: number;
    size: number;
    vx: number;
    vz: number;
}

export interface Chunk {
    body: DebrisBody;
    scale: THREE.Vector3;
    born: number;
}

export interface Spawner {
    cursor: number;
    seed: number;
}

export function MeteorChunks( { material }: { material: THREE.Material } ) {
    const track = useTrack();
    const geometry = useMemo( () => {
        const g = asteroidGeometry( CHUNK_SEED, CHUNK_DETAIL );
        const heat = new THREE.InstancedBufferAttribute( new Float32Array( LIMIT ), 1 );
        heat.setUsage( THREE.DynamicDrawUsage );
        g.setAttribute( 'aRockHeat', heat );
        return g;
    }, [] );
    const hull = useMemo( () => rockHull( geometry ), [ geometry ] );
    const chunks = useMemo< Chunk[] >(
        () => Array.from( { length: LIMIT }, () => ( { body: makeBody(), scale: new THREE.Vector3(), born: 0 } ) ),
        [],
    );
    const ground = useMemo( () => trackGround( track, blockWorld.broken ), [ track ] );
    const spawner = useRef< Spawner >( { cursor: 0, seed: 1 } );
    const meshRef = useRef< THREE.InstancedMesh | null >( null );

    // JUSTIFIED EFFECT — brackets the lifetime of GPU geometry we built ourselves.
    useEffect( () => () => geometry.dispose(), [ geometry ] );

    useFrame( ( frame, delta ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        const now = frame.clock.elapsedTime;
        const heat = geometry.getAttribute( 'aRockHeat' ) as THREE.InstancedBufferAttribute;
        spawnPending( chunks, hull, spawner.current, now );
        const t = beginTick( _tick, ground, delta, frame.camera.position.z );
        const cool = Math.max( 0.05, num( 'Meteor.cool' ) * HEAT_SHARE );
        let top = 0;
        for ( let i = 0; i < LIMIT; i++ ) {
            const c = chunks[ i ];
            if ( ! moveBody( c.body, t, LIFE ) ) {
                mesh.setMatrixAt( i, _zero );
                heat.setX( i, 0 );
                continue;
            }
            top = i + 1;
            mesh.setMatrixAt( i, _m.compose( c.body.p, c.body.q, c.scale ) );
            heat.setX( i, Math.exp( -( now - c.born ) / cool ) );
            sparkOnLanding( c.body, t, SPARK_SLAM );
        }
        mesh.count = top;
        mesh.instanceMatrix.needsUpdate = true;
        heat.needsUpdate = true;
    } );

    return <instancedMesh ref={ meshRef } args={ [ geometry, material, LIMIT ] } count={ 0 } frustumCulled={ false } />;
}
