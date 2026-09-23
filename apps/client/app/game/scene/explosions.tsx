import { useFrame } from '@react-three/fiber';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Interp, LocalPlayer, Render, Sim } from '../ecs/traits';
import { ACCENT_ANCHOR } from './accent';

const MAX = 240;
const PER_BURST = 40;
const LIFE_MIN = 0.5;
const LIFE_MAX = 0.95;
const SPEED = 16;
const UP_BIAS = 6;
const DRAG = 2.2;
const GRAV = 18;
const SIZE = 0.16;
const BRIGHT = 2.6;

const _o = new THREE.Object3D();
const _c = new THREE.Color();
const LOCAL_CORE = new THREE.Color( '#FFFBE7' );
const REMOTE_CORE = new THREE.Color( '#FFB52E' );
const MARIGOLD = new THREE.Color( ACCENT_ANCHOR );

interface Shard {
    active: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    r: number;
    g: number;
    b: number;
}

function makePool(): Shard[] {
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
        r: 0,
        g: 0,
        b: 0,
    } ) );
}

function spawnBurst( pool: Shard[], x: number, y: number, z: number, tint: THREE.Color ): void {
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
        p.r = tint.r;
        p.g = tint.g;
        p.b = tint.b;
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

function detectDeaths( world: World, pool: Shard[], wasDead: Map< number, boolean > ): void {
    for ( const e of world.query( Render ) ) {
        const grp = e.get( Render );
        if ( ! grp ) continue;
        const sim = e.get( Sim );
        const buf = sim ? undefined : e.get( Interp )?.buffer;
        const dead = sim ? sim.dead : buf !== undefined && buf.length > 0 && buf[ buf.length - 1 ].dead;
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

function advanceShards( mesh: THREE.InstancedMesh, pool: Shard[], dt: number ): void {
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
        mesh.setColorAt(
            i,
            _c
                .setRGB( p.r, p.g, p.b )
                .lerp( MARIGOLD, 1 - f )
                .multiplyScalar( b ),
        );
    }
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}

export function ExplosionField() {
    const world = useWorld();
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const pool = useMemo( makePool, [] );
    const wasDead = useMemo( () => new Map< number, boolean >(), [] );
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
        detectDeaths( world, pool, wasDead );
        advanceShards( mesh, pool, delta );
    } );

    return (
        <instancedMesh ref={ setMesh } frustumCulled={ false } args={ [ undefined, undefined, MAX ] }>
            <boxGeometry args={ [ 1, 1, 1 ] } />
            <meshBasicMaterial transparent depthWrite={ false } blending={ THREE.AdditiveBlending } />
        </instancedMesh>
    );
}
