import { useFrame } from '@react-three/fiber';
import type { Track } from '@slur/shared';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { useRebuildToken } from '../../dev/use-rebuild-token';
import { blockWorld } from '../block-state';
import { shake, shakeFrom } from '../camera/shake';
import { hash01 } from './asteroid-field';
import { BREAK_SMASH, type BreakEvent, drainBreaks, drainMends, settled } from './block-breaks';
import { queueBurst } from './block-burst';
import { trackGround } from './debris-ground';
import { addHullPoint, type DebrisBody, type DebrisGround, makeBody, resetBody, setBoxInertia } from './debris-physics';
import { beginTick, type DebrisTick, makeTick, moveBody, sparkOnLanding } from './debris-tick';
import { applyDeckFinish } from './deck-finish';
import {
    cellGeometry,
    cellHull,
    cellVolume,
    type FractureCell,
    fractureCells,
    fractureOrient,
    fractureTurn,
} from './fractured-block-geometry';
import { type FracturedBlockUniforms, patchFracturedBlock } from './fractured-block-shader';
import { pushHit } from './hit-events';
import { graphiteSurface } from './track-materials';

const SLOTS = 12;
const LIFE = 14;
const LIGHT_MIN = 0.6;
const LIGHT_MAX = 1.9;
const LIFT = 0.35;
const SPARK_SLAM = 9;
const SMASH_SHAKE = 0.32;
const BOLT_SHAKE = 0.22;
const BOLT_SHAKE_REACH = 45;
const THUD_SLAM = 16;
const THUD_SHAKE = 0.05;
const THUD_REACH = 30;

interface Slot {
    id: number;
    born: number;
    bodies: DebrisBody[];
}

interface Debris {
    cells: FractureCell[];
    hulls: THREE.Vector3[][];
    volumes: number[];
    geometries: THREE.BufferGeometry[];
    block: THREE.InstancedBufferAttribute;
    glow: THREE.InstancedBufferAttribute;
    slots: Slot[];
    cursor: number;
}

const _m = new THREE.Matrix4();
const _zero = new THREE.Matrix4().makeScale( 0, 0, 0 );
const _one = new THREE.Vector3( 1, 1, 1 );
const _size = new THREE.Vector3();
const _centre = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _half = new THREE.Vector3();
const _shrink = new THREE.Vector3();
const _point = new THREE.Vector3();
const _away = new THREE.Vector3();
const _tick = makeTick();

function buildDebris(): Debris {
    const cells = fractureCells();
    const block = new THREE.InstancedBufferAttribute( new Float32Array( SLOTS * 4 ), 4 );
    const glow = new THREE.InstancedBufferAttribute( new Float32Array( SLOTS ), 1 );
    const geometries = cells.map( ( _, i ) => {
        const g = cellGeometry( i );
        g.setAttribute( 'aBlock', block );
        g.setAttribute( 'aFractureGlow', glow );
        return g;
    } );
    return {
        cells,
        hulls: cells.map( cellHull ),
        volumes: cells.map( cellVolume ),
        geometries,
        block,
        glow,
        slots: Array.from( { length: SLOTS }, () => ( {
            id: -1,
            born: 0,
            bodies: cells.map( makeBody ),
        } ) ),
        cursor: 0,
    };
}

function free( slot: Slot ): void {
    if ( slot.id >= 0 ) settled( slot.id );
    slot.id = -1;
    for ( const b of slot.bodies ) b.live = false;
}

function rnd( id: number, cell: number, salt: number ): number {
    return hash01( Math.imul( id, 0x2c1b_3c6d ) ^ Math.imul( cell + 1, 0x297a_2d39 ), salt );
}

function launch( d: Debris, body: DebrisBody, c: number, e: BreakEvent, orient: number, reach: number ): void {
    const cell = d.cells[ c ];
    const id = e.block.id;
    const gap = num( 'Fracture.gap' );
    resetBody( body );
    fractureTurn( cell.centre, orient, _offset ).multiply( _size );
    body.p.copy( _centre ).add( _offset );
    fractureTurn( cell.half, orient, _half ).multiply( _size );
    _half.set( Math.abs( _half.x ), Math.abs( _half.y ), Math.abs( _half.z ) );
    _shrink.set(
        Math.max( 0, 1 - gap / Math.max( _half.x, 1e-3 ) ),
        Math.max( 0, 1 - gap / Math.max( _half.y, 1e-3 ) ),
        Math.max( 0, 1 - gap / Math.max( _half.z, 1e-3 ) ),
    );
    for ( const h of d.hulls[ c ] ) {
        fractureTurn( h, orient, _point ).multiply( _size ).sub( _offset ).multiply( _shrink );
        addHullPoint( body, _point.x, _point.y, _point.z );
    }
    setBoxInertia( body, 2 * _half.x * _shrink.x, 2 * _half.y * _shrink.y, 2 * _half.z * _shrink.z );

    const light = Math.min(
        LIGHT_MAX,
        Math.max( LIGHT_MIN, Math.cbrt( 1 / ( d.cells.length * Math.max( d.volumes[ c ], 1e-4 ) ) ) ),
    );
    _away.set( body.p.x - e.x, body.p.y - e.y, body.p.z - e.z );
    const dist = _away.length();
    if ( dist < 1e-3 ) _away.set( 0, 0, 1 );
    else _away.divideScalar( dist );
    _away.y += LIFT;
    _away.normalize();
    const near = 1 / ( 1 + ( 2 * dist ) / reach );
    const speed = num( 'Break.speed' ) * near * light * ( 0.7 + 0.6 * rnd( id, c, 1 ) );
    body.v.copy( _away ).multiplyScalar( speed );
    body.v.y += num( 'Break.up' ) * light * ( 0.4 + 0.6 * rnd( id, c, 2 ) ) * ( 0.4 + near );
    if ( e.kind === BREAK_SMASH ) {
        body.v.z += num( 'Break.carry' ) * e.vz * ( 0.55 + 0.45 * near ) * ( 0.8 + 0.4 * rnd( id, c, 3 ) );
    }
    body.w
        .set( rnd( id, c, 4 ) - 0.5, rnd( id, c, 5 ) - 0.5, rnd( id, c, 6 ) - 0.5 )
        .normalize()
        .multiplyScalar( num( 'Break.spin' ) * light * ( 0.3 + near ) );
}

function spawn( d: Debris, e: BreakEvent, now: number ): void {
    const i = d.cursor;
    d.cursor = ( i + 1 ) % SLOTS;
    const slot = d.slots[ i ];
    free( slot );
    const b = e.block;
    _size.set( b.x1 - b.x0, Math.max( 0.05, b.y1 - b.y0 ), b.z1 - b.z0 );
    _centre.set( ( b.x0 + b.x1 ) / 2, ( b.y0 + b.y1 ) / 2, ( b.z0 + b.z1 ) / 2 );
    const orient = fractureOrient( b.id );
    const reach = Math.max( _size.x, _size.y, _size.z );
    slot.id = b.id;
    slot.born = now;
    d.block.setXYZW( i, _size.x, _size.y, _size.z, orient );
    d.block.needsUpdate = true;
    for ( let c = 0; c < d.cells.length; c++ ) launch( d, slot.bodies[ c ], c, e, orient, reach );
    queueBurst( _centre.x, _centre.y, _centre.z, reach );
    pushHit( { x: e.x, y: e.y, z: e.z } );
    if ( e.kind === BREAK_SMASH ) shake( SMASH_SHAKE );
    else shakeFrom( _centre.x, _centre.y, _centre.z, BOLT_SHAKE, BOLT_SHAKE_REACH );
}

function mend( d: Debris, id: number ): void {
    for ( const slot of d.slots ) if ( slot.id === id ) free( slot );
}

function advanceSlot( slot: Slot, i: number, meshes: ( THREE.InstancedMesh | null )[], t: DebrisTick ): boolean {
    let alive = false;
    for ( let c = 0; c < slot.bodies.length; c++ ) {
        const body = slot.bodies[ c ];
        const live = moveBody( body, t, LIFE );
        meshes[ c ]?.setMatrixAt( i, live ? _m.compose( body.p, body.q, _one ) : _zero );
        if ( ! live ) continue;
        alive = true;
        sparkOnLanding( body, t, SPARK_SLAM );
        if ( body.slam > THUD_SLAM ) shakeFrom( body.p.x, body.p.y, body.p.z, THUD_SHAKE, THUD_REACH );
    }
    return alive;
}

function advance(
    d: Debris,
    meshes: ( THREE.InstancedMesh | null )[],
    ground: DebrisGround,
    now: number,
    delta: number,
    camZ: number,
): boolean {
    const t = beginTick( _tick, ground, delta, camZ );
    const flare = num( 'Break.flare' );
    const cool = Math.max( 0.05, num( 'Break.cool' ) );
    let any = false;
    for ( let i = 0; i < SLOTS; i++ ) {
        const slot = d.slots[ i ];
        if ( slot.id < 0 ) {
            for ( const mesh of meshes ) mesh?.setMatrixAt( i, _zero );
            continue;
        }
        d.glow.setX( i, flare * Math.exp( -( now - slot.born ) / cool ) );
        if ( advanceSlot( slot, i, meshes, t ) ) any = true;
        else free( slot );
    }
    d.glow.needsUpdate = true;
    return any;
}

export function BlockDebris( { track, uniforms }: { track: Track; uniforms: FracturedBlockUniforms } ) {
    const rebuild = useRebuildToken();
    const debris = useMemo( buildDebris, [] );
    const ground = useMemo( () => trackGround( track, blockWorld.broken ), [ track ] );
    const meshes = useRef< ( THREE.InstancedMesh | null )[] >( [] );
    const material = useMemo( () => {
        const m = new THREE.MeshStandardMaterial( graphiteSurface() );
        patchFracturedBlock( m, uniforms, true );
        return m;
    }, [ rebuild, uniforms ] );

    const release = useCallback(
        ( group: THREE.Group | null ) => () => {
            if ( ! group ) return;
            for ( const g of debris.geometries ) g.dispose();
            material.dispose();
        },
        [ debris, material ],
    );

    useFrame( ( state, delta ) => {
        const now = state.clock.elapsedTime;
        applyDeckFinish( material );
        drainMends( ( id ) => mend( debris, id ) );
        drainBreaks( ( e ) => spawn( debris, e, now ) );
        const live = advance( debris, meshes.current, ground, now, delta, state.camera.position.z );
        for ( const mesh of meshes.current ) {
            if ( ! mesh ) continue;
            mesh.count = live ? SLOTS : 0;
            mesh.instanceMatrix.needsUpdate = true;
        }
    } );

    return (
        <group ref={ release }>
            { debris.geometries.map( ( geometry, c ) => (
                <instancedMesh
                    key={ geometry.uuid }
                    ref={ ( m ) => {
                        meshes.current[ c ] = m;
                    } }
                    args={ [ geometry, material, SLOTS ] }
                    count={ 0 }
                    frustumCulled={ false }
                />
            ) ) }
        </group>
    );
}
