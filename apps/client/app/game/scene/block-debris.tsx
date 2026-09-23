import { useFrame } from '@react-three/fiber';
import type { Block } from '@slur/shared';
import { Fragment, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { drainBreaks, fractureYaw } from './block-breaks';
import { applyBlockMetal } from './block-metal';
import { type DebrisPiece, fracturedDebrisPieces } from './fractured-block-geometry';
import { type FracturedBlockUniforms, patchFracturedBlock } from './fractured-block-shader';
import { SEALED_BLOCK_SURFACE } from './sealed-block-material';
import { useSealedBlockMaps } from './sealed-block-texture';

const PER_MESH = 24;
const LIFE = 1.4;
const MAX_DT = 1 / 20;
const GRAV = 34;
const SIDE = 7;
const SIDE_JIT = 5;
const UP = 9;
const UP_JIT = 5;
const FWD = 6;
const FWD_JIT = 8;
const SPIN = 3.5;
const BOUNCE = 0.3;
const FRICTION = 0.6;
const SHRINK_FROM = 0.55;

interface Piece {
    active: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    rx: number;
    ry: number;
    rz: number;
    wx: number;
    wz: number;
    sx: number;
    sy: number;
    sz: number;
    floor: number;
    life: number;
}

const _o = new THREE.Object3D();

function makePool(): Piece[] {
    return Array.from( { length: PER_MESH }, () => ( {
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        wx: 0,
        wz: 0,
        sx: 1,
        sy: 1,
        sz: 1,
        floor: 0,
        life: 0,
    } ) );
}

function freeSlot( pool: Piece[] ): Piece | undefined {
    for ( const p of pool ) if ( ! p.active ) return p;
    return undefined;
}

function launch( pool: Piece[], piece: DebrisPiece, b: Block ): void {
    const p = freeSlot( pool );
    if ( ! p ) return;
    const w = b.x1 - b.x0;
    const h = b.y1 - b.y0;
    const yaw = fractureYaw( b.id );
    const ox = piece.centre.x * w * ( yaw === 0 ? 1 : -1 );
    const side = ox < 0 ? -1 : 1;
    p.active = true;
    p.life = LIFE;
    p.x = ( b.x0 + b.x1 ) / 2 + ox;
    p.y = ( b.y0 + b.y1 ) / 2 + piece.centre.y * h;
    p.z = ( b.z0 + b.z1 ) / 2;
    p.vx = side * ( SIDE + Math.random() * SIDE_JIT );
    p.vy = UP + Math.random() * UP_JIT;
    p.vz = FWD + Math.random() * FWD_JIT;
    p.rx = 0;
    p.ry = yaw;
    p.rz = 0;
    p.wx = ( Math.random() - 0.5 ) * SPIN;
    p.wz = -side * SPIN * ( 0.6 + Math.random() * 0.8 );
    p.sx = w;
    p.sy = h;
    p.sz = b.z1 - b.z0;
    p.floor = b.y0 + 0.25 * Math.min( w, h );
}

function step( p: Piece, dt: number ): void {
    p.life -= dt;
    p.vy -= GRAV * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    if ( p.y < p.floor && p.vy < 0 ) {
        p.y = p.floor;
        p.vy = -p.vy * BOUNCE;
        p.vx *= FRICTION;
        p.vz *= FRICTION;
        p.wx *= FRICTION;
        p.wz *= FRICTION;
    }
    p.rx += p.wx * dt;
    p.rz += p.wz * dt;
}

function advance( mesh: THREE.InstancedMesh, pool: Piece[], glow: THREE.InstancedBufferAttribute, dt: number ): void {
    const glows = glow.array as Float32Array;
    let n = 0;
    for ( const p of pool ) {
        if ( ! p.active ) continue;
        step( p, dt );
        if ( p.life <= 0 ) {
            p.active = false;
            continue;
        }
        const f = p.life / LIFE;
        const k = Math.min( 1, f / SHRINK_FROM );
        _o.position.set( p.x, p.y, p.z );
        _o.rotation.set( p.rx, p.ry, p.rz );
        _o.scale.set( p.sx * k, p.sy * k, p.sz * k );
        _o.updateMatrix();
        mesh.setMatrixAt( n, _o.matrix );
        glows[ n ] = f * f;
        n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    glow.needsUpdate = true;
}

export function BlockDebris( { uniforms }: { uniforms: FracturedBlockUniforms } ) {
    const maps = useSealedBlockMaps();
    const pieces = useMemo( fracturedDebrisPieces, [] );
    const pools = useMemo( () => pieces.map( makePool ), [ pieces ] );
    const glows = useMemo(
        () =>
            pieces.map( ( piece ) => {
                const attr = new THREE.InstancedBufferAttribute( new Float32Array( PER_MESH ), 1 );
                piece.geometry.setAttribute( 'aFractureGlow', attr );
                return attr;
            } ),
        [ pieces ],
    );
    const meshes = useRef< ( THREE.InstancedMesh | null )[] >( [] );

    const spawn = useCallback(
        ( b: Block ) => {
            for ( let k = 0; k < pieces.length; k++ ) launch( pools[ k ], pieces[ k ], b );
        },
        [ pieces, pools ],
    );

    useFrame( ( _state, delta ) => {
        drainBreaks( spawn );
        const dt = Math.min( delta, MAX_DT );
        for ( let k = 0; k < pieces.length; k++ ) {
            const mesh = meshes.current[ k ];
            if ( ! mesh ) continue;
            applyBlockMetal( mesh.material as THREE.MeshStandardMaterial );
            advance( mesh, pools[ k ], glows[ k ], dt );
        }
    } );

    return (
        <Fragment>
            { pieces.map( ( piece, k ) => (
                <instancedMesh
                    key={ piece.geometry.uuid }
                    ref={ ( m ) => {
                        meshes.current[ k ] = m;
                    } }
                    geometry={ piece.geometry }
                    count={ 0 }
                    frustumCulled={ false }
                    args={ [ undefined, undefined, PER_MESH ] }
                >
                    <meshStandardMaterial
                        { ...SEALED_BLOCK_SURFACE }
                        { ...maps }
                        ref={ ( m ) => m && patchFracturedBlock( m, uniforms ) }
                    />
                </instancedMesh>
            ) ) }
        </Fragment>
    );
}
