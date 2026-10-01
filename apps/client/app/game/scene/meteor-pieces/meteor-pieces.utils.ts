import { mulberry32 } from '@slur/shared';
import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { addHullPoint, makeBody, resetBody, setBoxInertia } from '../debris-physics';
import { type DebrisTick, moveBody, sparkOnLanding } from '../debris-tick';
import { rockHull } from '../meteor-assets';
import { PIECE_LIMIT } from '../meteor-material';
import type { MeteorRock } from '../meteor-rock/meteor-rock.utils';
import type { PieceBurst, PieceShape, Slot, Spawner } from './meteor-pieces';
import {
    _zero,
    COOL_SHARE,
    HEAT_HOLD,
    HEAT_PEAK,
    HEAT_START,
    HULL_SHRINK,
    LIFE,
    SIZE_REFERENCE,
    SLOTS,
    SPARK_SLAM,
    TEXELS_PER_PIECE,
} from './meteor-pieces.constants';
import { _m, _s, _v } from './meteor-pieces.scratch';
import { pending } from './meteor-pieces.state';

export function queuePieces( b: PieceBurst ): void {
    pending.push( b );
}

export function stepSlot( slot: Slot, index: number, data: Float32Array, t: DebrisTick ): boolean {
    let alive = false;
    for ( let k = 0; k < PIECE_LIMIT; k++ ) {
        const body = slot.bodies[ k ];
        if ( k >= slot.count || ! slot.live || ! moveBody( body, t, LIFE ) ) {
            writePiece( data, index, k, _zero );
            continue;
        }
        alive = true;
        writePiece( data, index, k, _m.compose( body.p, body.q, _s.setScalar( slot.scale ) ) );
        sparkOnLanding( body, t, SPARK_SLAM );
    }
    slot.live = alive;
    return alive;
}

export function pieceShapes( rock: MeteorRock ): PieceShape[] {
    return rock.pieces.slice( 0, PIECE_LIMIT ).map( ( p ) => {
        p.geometry.computeBoundingBox();
        const box = p.geometry.boundingBox as THREE.Box3;
        return { center: p.center.clone(), hull: rockHull( p.geometry ), size: box.getSize( new THREE.Vector3() ) };
    } );
}

export function makeSlot(): Slot {
    return {
        live: false,
        born: 0,
        scale: 1,
        count: 0,
        quat: new THREE.Quaternion(),
        bodies: Array.from( { length: PIECE_LIMIT }, makeBody ),
    };
}

export function pieceTexture(): THREE.DataTexture {
    const data = new Float32Array( PIECE_LIMIT * TEXELS_PER_PIECE * SLOTS * 4 );
    const texture = new THREE.DataTexture(
        data,
        PIECE_LIMIT * TEXELS_PER_PIECE,
        SLOTS,
        THREE.RGBAFormat,
        THREE.FloatType,
    );
    texture.needsUpdate = true;
    return texture;
}

export function writePiece( data: Float32Array, slot: number, piece: number, m: THREE.Matrix4 ): void {
    m.toArray( data, ( slot * PIECE_LIMIT + piece ) * TEXELS_PER_PIECE * 4 );
}

export function pieceHeat( age: number, cool: number ): number {
    if ( age < HEAT_HOLD ) return HEAT_PEAK - age * 2;
    return Math.max( 0, HEAT_START * Math.exp( -( age - HEAT_HOLD ) / ( cool * COOL_SHARE ) ) );
}

function launch( slot: Slot, shapes: readonly PieceShape[], b: PieceBurst, rand: () => number, now: number ): void {
    const spray = num( 'Meteor.spray' );
    const lift = num( 'Meteor.lift' );
    const carry = num( 'Meteor.carry' );
    const tumble = num( 'Meteor.tumble' ) / Math.sqrt( Math.max( 0.1, b.scale / SIZE_REFERENCE ) );
    slot.live = true;
    slot.born = now;
    slot.scale = b.scale;
    slot.count = shapes.length;
    slot.quat.set( b.qx, b.qy, b.qz, b.qw );
    for ( let i = 0; i < PIECE_LIMIT; i++ ) {
        const body = slot.bodies[ i ];
        const shape = shapes[ i ];
        if ( ! shape ) {
            body.live = false;
            continue;
        }
        resetBody( body );
        for ( const p of shape.hull ) {
            addHullPoint( body, p.x * b.scale * HULL_SHRINK, p.y * b.scale * HULL_SHRINK, p.z * b.scale * HULL_SHRINK );
        }
        _s.copy( shape.size ).multiplyScalar( b.scale );
        setBoxInertia( body, _s.x, _s.y, _s.z );
        _v.copy( shape.center ).multiplyScalar( b.scale ).applyQuaternion( slot.quat );
        body.p.set( b.x, b.y, b.z ).add( _v );
        body.q.copy( slot.quat );
        if ( _v.lengthSq() < 1e-8 ) _v.set( 0, 1, 0 );
        _v.normalize();
        body.v.copy( _v ).multiplyScalar( spray * ( 0.55 + rand() * 0.6 ) );
        body.v.y = Math.abs( body.v.y ) * 0.35 + spray * lift * ( 0.4 + rand() * 0.6 );
        body.v.x += b.vx * carry * ( 0.7 + rand() * 0.5 );
        body.v.z += b.vz * carry * ( 0.7 + rand() * 0.5 );
        body.w
            .set( rand() - 0.5, rand() - 0.5, rand() - 0.5 )
            .normalize()
            .multiplyScalar( tumble * ( 0.4 + rand() * 0.8 ) );
    }
}

export function spawnPending( slots: Slot[], shapes: readonly PieceShape[], s: Spawner, now: number ): void {
    for ( const b of pending.items ) {
        launch( slots[ s.cursor ], shapes, b, mulberry32( Math.imul( s.seed++, 0x9e37_79b1 ) ), now );
        s.cursor = ( s.cursor + 1 ) % SLOTS;
    }
    pending.clear();
}
