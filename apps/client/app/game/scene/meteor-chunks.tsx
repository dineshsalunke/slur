import { useFrame } from '@react-three/fiber';
import { mulberry32, type Track } from '@slur/shared';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { blockWorld } from '../block-state';
import { asteroidGeometry } from './asteroid-geometry';
import { trackGround } from './debris-ground';
import { addHullPoint, type DebrisBody, makeBody, resetBody, setBoxInertia } from './debris-physics';
import { beginTick, makeTick, moveBody, sparkOnLanding } from './debris-tick';
import { rockHull } from './meteor-assets';

const LIMIT = 96;
const QUEUE = 8;
const LIFE = 12;
const CARRY = 0.22;
const HULL_SHRINK = 0.9;
const SPARK_SLAM = 8;
const HEAT_SHARE = 0.25;
const CHUNK_SEED = 0x5eed_c4ac;
const CHUNK_DETAIL = 3;
const BASE_COUNT = 9;
const COUNT_PER_SIZE = 2.2;

export interface ChunkBurst {
    x: number;
    y: number;
    z: number;
    size: number;
    vx: number;
    vz: number;
}

const pending: ChunkBurst[] = [];

export function queueChunks( b: ChunkBurst ): void {
    if ( pending.length < QUEUE ) pending.push( b );
}

interface Chunk {
    body: DebrisBody;
    scale: THREE.Vector3;
    born: number;
}

interface Spawner {
    cursor: number;
    seed: number;
}

const _m = new THREE.Matrix4();
const _zero = new THREE.Matrix4().makeScale( 0, 0, 0 );
const _tick = makeTick();

function launch( c: Chunk, hull: readonly THREE.Vector3[], b: ChunkBurst, rand: () => number, now: number ): void {
    const body = c.body;
    resetBody( body );
    const s = b.size * ( 0.07 + 0.15 * rand() * rand() );
    c.scale.set( s * ( 0.8 + 0.4 * rand() ), s * ( 0.55 + 0.35 * rand() ), s * ( 0.8 + 0.4 * rand() ) );
    c.born = now;
    for ( const p of hull ) {
        addHullPoint(
            body,
            p.x * c.scale.x * HULL_SHRINK,
            p.y * c.scale.y * HULL_SHRINK,
            p.z * c.scale.z * HULL_SHRINK,
        );
    }
    setBoxInertia( body, 2 * c.scale.x, 2 * c.scale.y, 2 * c.scale.z );
    const a = rand() * Math.PI * 2;
    const d = rand() * b.size * 0.5;
    body.p.set( b.x + Math.cos( a ) * d, b.y + c.scale.y * 1.2 + rand() * b.size * 0.3, b.z + Math.sin( a ) * d );
    const spray = num( 'Meteor.spray' );
    const out = spray * ( 0.3 + 0.9 * rand() );
    body.v.set(
        Math.cos( a ) * out + b.vx * CARRY * ( 0.6 + 0.8 * rand() ),
        spray * ( 0.45 + 0.7 * rand() ),
        Math.sin( a ) * out + b.vz * CARRY * ( 0.6 + 0.8 * rand() ),
    );
    body.w
        .set( rand() - 0.5, rand() - 0.5, rand() - 0.5 )
        .normalize()
        .multiplyScalar( ( 2 + 4 * rand() ) / Math.max( 0.6, s ) );
}

function spawnPending( chunks: Chunk[], hull: readonly THREE.Vector3[], s: Spawner, now: number ): void {
    for ( const b of pending ) {
        const rand = mulberry32( Math.imul( s.seed++, 0x9e37_79b1 ) );
        const n = Math.round( ( BASE_COUNT + b.size * COUNT_PER_SIZE ) * num( 'Meteor.chunks' ) );
        for ( let k = 0; k < n; k++ ) {
            launch( chunks[ s.cursor ], hull, b, rand, now );
            s.cursor = ( s.cursor + 1 ) % LIMIT;
        }
    }
    pending.length = 0;
}

export function MeteorChunks( { track, material }: { track: Track; material: THREE.Material } ) {
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
