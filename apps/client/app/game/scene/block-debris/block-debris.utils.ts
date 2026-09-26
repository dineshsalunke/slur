import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { shake, shakeFrom } from '../../camera/shake';
import { hash01 } from '../asteroid-field';
import { BREAK_SMASH, type BreakEvent, settled } from '../block-breaks';
import { queueBurst } from '../block-burst/block-burst.utils';
import {
    addHullPoint,
    type DebrisBody,
    type DebrisGround,
    makeBody,
    resetBody,
    setBoxInertia,
} from '../debris-physics';
import { beginTick, type DebrisTick, moveBody, sparkOnLanding } from '../debris-tick';
import {
    cellGeometry,
    cellHull,
    cellVolume,
    fractureCells,
    fractureOrient,
    fractureTurn,
} from '../fractured-block-geometry';
import { pushHit } from '../hit-events';
import type { Debris, Slot } from './block-debris';
import {
    _away,
    _centre,
    _half,
    _m,
    _offset,
    _one,
    _point,
    _shrink,
    _size,
    _tick,
    _zero,
    BOLT_SHAKE,
    BOLT_SHAKE_REACH,
    LIFE,
    LIFT,
    LIGHT_MAX,
    LIGHT_MIN,
    SLOTS,
    SMASH_SHAKE,
    SPARK_SLAM,
    THUD_REACH,
    THUD_SHAKE,
    THUD_SLAM,
} from './block-debris.constants';

export function buildDebris(): Debris {
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
            parked: false,
            bodies: cells.map( makeBody ),
        } ) ),
        cursor: 0,
        dirty: false,
        now: 0,
    };
}

export function free( slot: Slot ): void {
    if ( slot.id >= 0 ) settled( slot.id );
    slot.id = -1;
    for ( const b of slot.bodies ) b.live = false;
}

export function rnd( id: number, cell: number, salt: number ): number {
    return hash01( Math.imul( id, 0x2c1b_3c6d ) ^ Math.imul( cell + 1, 0x297a_2d39 ), salt );
}

export function launch( d: Debris, body: DebrisBody, c: number, e: BreakEvent, orient: number, reach: number ): void {
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

export function spawn( d: Debris, e: BreakEvent, now: number ): void {
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
    slot.parked = false;
    d.block.setXYZW( i, _size.x, _size.y, _size.z, orient );
    d.block.needsUpdate = true;
    for ( let c = 0; c < d.cells.length; c++ ) launch( d, slot.bodies[ c ], c, e, orient, reach );
    queueBurst( _centre.x, _centre.y, _centre.z, reach );
    pushHit( { x: e.x, y: e.y, z: e.z } );
    if ( e.kind === BREAK_SMASH ) shake( SMASH_SHAKE );
    else shakeFrom( _centre.x, _centre.y, _centre.z, BOLT_SHAKE, BOLT_SHAKE_REACH );
}

export function mend( d: Debris, id: number ): void {
    for ( const slot of d.slots ) if ( slot.id === id ) free( slot );
}

export function advanceSlot( slot: Slot, i: number, meshes: ( THREE.InstancedMesh | null )[], t: DebrisTick ): boolean {
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

export function advance(
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
    let active = false;
    for ( let i = 0; i < SLOTS; i++ ) {
        const slot = d.slots[ i ];
        if ( slot.id < 0 ) {
            if ( slot.parked ) continue;
            for ( const mesh of meshes ) mesh?.setMatrixAt( i, _zero );
            slot.parked = true;
            d.dirty = true;
            continue;
        }
        active = true;
        d.glow.setX( i, flare * Math.exp( -( now - slot.born ) / cool ) );
        if ( advanceSlot( slot, i, meshes, t ) ) any = true;
        else free( slot );
    }
    if ( active ) {
        d.glow.needsUpdate = true;
        d.dirty = true;
    }
    return any;
}
