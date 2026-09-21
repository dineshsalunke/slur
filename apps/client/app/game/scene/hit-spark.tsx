import { useFrame } from '@react-three/fiber';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { drainHits } from './hit-events';

const MAX = 200;
const PER_BURST = 22;
const LIFE_MIN = 0.18;
const LIFE_MAX = 0.4;
const SPEED = 22;
const UP_BIAS = 2;
const DRAG = 4;
const GRAV = 6;
const SIZE = 0.15;
const BRIGHT = 3.2;

const _o = new THREE.Object3D();
const _c = new THREE.Color();
const SPARK = new THREE.Color( '#a8ffff' );

interface Spark {
    active: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
}

function makePool(): Spark[] {
    return Array.from( { length: MAX }, () => ( {
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
    } ) );
}

function spawnBurst( pool: Spark[], x: number, y: number, z: number ): void {
    let n = 0;
    for ( let i = 0; i < MAX && n < PER_BURST; i++ ) {
        const p = pool[ i ];
        if ( p.active ) continue;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos( 2 * Math.random() - 1 );
        const speed = SPEED * ( 0.5 + Math.random() );
        p.active = true;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = Math.sin( phi ) * Math.cos( theta ) * speed;
        p.vz = Math.sin( phi ) * Math.sin( theta ) * speed;
        p.vy = Math.cos( phi ) * speed + UP_BIAS;
        p.maxLife = p.life = LIFE_MIN + Math.random() * ( LIFE_MAX - LIFE_MIN );
        n++;
    }
}

function park( mesh: THREE.InstancedMesh, i: number ): void {
    _o.position.set( 0, -9999, 0 );
    _o.scale.set( 0, 0, 0 );
    _o.updateMatrix();
    mesh.setMatrixAt( i, _o.matrix );
}

function initPool( mesh: THREE.InstancedMesh ): void {
    for ( let i = 0; i < MAX; i++ ) {
        park( mesh, i );
        mesh.setColorAt( i, _c.setRGB( 0, 0, 0 ) );
    }
}

function advanceSparks( mesh: THREE.InstancedMesh, pool: Spark[], dt: number ): void {
    const damp = Math.max( 0, 1 - DRAG * dt );
    for ( let i = 0; i < MAX; i++ ) {
        const p = pool[ i ];
        if ( ! p.active ) continue;
        p.life -= dt;
        if ( p.life <= 0 ) {
            p.active = false;
            park( mesh, i );
            continue;
        }
        p.vy -= GRAV * dt;
        p.vx *= damp;
        p.vy *= damp;
        p.vz *= damp;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        const f = p.life / p.maxLife;
        const s = SIZE * ( 0.35 + 0.75 * f );
        _o.position.set( p.x, p.y, p.z );
        _o.scale.set( s, s, s );
        _o.updateMatrix();
        mesh.setMatrixAt( i, _o.matrix );
        const b = BRIGHT * f * f;
        mesh.setColorAt( i, _c.setRGB( SPARK.r * b, SPARK.g * b, SPARK.b * b ) );
    }
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}

export function HitSpark() {
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const pool = useMemo( makePool, [] );
    const inited = useRef( false );

    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        meshRef.current = mesh;
        if ( mesh && ! inited.current ) {
            initPool( mesh );
            inited.current = true;
        }
    }, [] );

    useFrame( ( _state, delta ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        drainHits( ( e ) => spawnBurst( pool, e.x, e.y, e.z ) );
        advanceSparks( mesh, pool, delta );
    } );

    return (
        <instancedMesh ref={ setMesh } frustumCulled={ false } args={ [ undefined, undefined, MAX ] }>
            <boxGeometry args={ [ 1, 1, 1 ] } />
            <meshBasicMaterial
                toneMapped={ false }
                transparent
                depthWrite={ false }
                blending={ THREE.AdditiveBlending }
            />
        </instancedMesh>
    );
}
