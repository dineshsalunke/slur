import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { shakeFrom } from '../../camera/shake';
import { accent } from '../accent';
import { queueBurst } from '../block-burst/block-burst.utils';
import type { DebrisGround } from '../debris-physics';
import { pushHit } from '../hit-events';
import { queueChunks } from '../meteor-chunks/meteor-chunks.utils';
import { queuePieces } from '../meteor-pieces/meteor-pieces.utils';
import { type Impact, impactFor, STRIKE_SPACING, type Strike, strikeAt, strikeWindow } from '../meteor-schedule';
import { queueScorch } from '../meteor-scorch/meteor-scorch.utils';
import type { Director, Flight, ReadyMeshes } from './meteor-strikes';
import {
    _zero,
    BURST_SIZE,
    COLLAPSE,
    CORE,
    FLIGHTS,
    GLOW_GAIN,
    GLOW_SIZE,
    HEAD_ATTRIBUTES,
    HEAD_LIFT,
    LIGHT_GAIN,
    MAX_SPEED,
    MIN_SPEED,
    PIT_DEPTH,
    SCAN,
    SHAKE_REACH,
    SHAKE_SIZE,
    SPARK_BURSTS,
    SPEED_WINDOW,
    TRAIL_GAIN,
    TRAIL_SECONDS,
    TRAIL_WIDTH,
    UP,
} from './meteor-strikes.constants';
import { _c, _dir, _impact, _m, _p, _q, _s } from './meteor-strikes.scratch';

export function makeFlight(): Flight {
    return {
        live: false,
        landed: false,
        t0: 0,
        flight: 1,
        start: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        tail: new THREE.Quaternion(),
        axis: new THREE.Vector3( 0, 1, 0 ),
        floor: 0,
        size: 1,
        spin: 0,
        speed: 0,
    };
}

export function makeDirector( ground: DebrisGround ): Director {
    return {
        flights: Array.from( { length: FLIGHTS }, makeFlight ),
        ground,
        cursor: 0,
        lastZ: Number.NaN,
        refZ: 0,
        refT: 0,
        speed: 0,
        lightAt: -99,
        lightSize: 0,
        lightX: 0,
        lightY: 0,
        lightZ: 0,
    };
}

export function isPit( f: Flight ): boolean {
    return f.floor === Number.NEGATIVE_INFINITY;
}

export function launch( d: Director, s: Strike, at: Impact, now: number ): void {
    const f = d.flights.find( ( x ) => ! x.live );
    if ( ! f ) return;
    const speed = num( 'Meteor.speed' );
    const flight = num( 'Meteor.flight' );
    const floor = d.ground.floor( at.x, at.z, 60 );
    f.live = true;
    f.landed = false;
    f.t0 = now;
    f.flight = flight;
    f.floor = floor;
    f.size = s.size * num( 'Meteor.size' );
    f.spin = s.spin;
    f.speed = speed;
    f.vel.set( -s.fromX, -s.fromY, -s.fromZ ).multiplyScalar( speed );
    f.start.set( at.x, isPit( f ) ? 0 : floor, at.z ).addScaledVector( f.vel, -flight );
    f.tail.setFromUnitVectors( UP, _dir.set( s.fromX, s.fromY, s.fromZ ) );
    f.axis.set( s.fromZ, s.fromX, -s.fromY ).normalize();
}

export function track( d: Director, z: number, now: number ): boolean {
    if ( Number.isNaN( d.lastZ ) || z < d.lastZ - STRIKE_SPACING ) {
        d.cursor = Math.floor( z / STRIKE_SPACING ) + 1;
        d.lastZ = z;
        d.refZ = z;
        d.refT = now;
        d.speed = 0;
        return false;
    }
    if ( now - d.refT >= SPEED_WINDOW ) {
        d.speed = ( z - d.refZ ) / ( now - d.refT );
        d.refZ = z;
        d.refT = now;
    }
    d.lastZ = z;
    return true;
}

export function schedule( d: Director, x: number, z: number, now: number ): void {
    if ( ! track( d, z, now ) ) return;
    const v = Math.max( MIN_SPEED, Math.min( MAX_SPEED, d.speed ) );
    const flight = num( 'Meteor.flight' );
    const ahead = num( 'Meteor.ahead' );
    const chance = num( 'Meteor.chance' );
    for ( let guard = 0; guard < SCAN; guard++ ) {
        if ( strikeWindow( d.cursor ) - STRIKE_SPACING > z ) return;
        const s = strikeAt( d.cursor, chance );
        if ( s && s.z > z ) return;
        d.cursor++;
        if ( s && z - s.z < STRIKE_SPACING ) launch( d, s, impactFor( s, x, z, v, flight, ahead, _impact ), now );
    }
}

export function land( d: Director, f: Flight, now: number ): void {
    f.landed = true;
    if ( isPit( f ) ) return;
    _p.copy( f.start ).addScaledVector( f.vel, f.flight );
    queueBurst( _p.x, f.floor + f.size * 0.4, _p.z, f.size * BURST_SIZE );
    for ( let k = 0; k < SPARK_BURSTS; k++ ) {
        pushHit( { x: _p.x + ( k - 1 ) * f.size * 0.4, y: f.floor + 0.3, z: _p.z + ( k - 1 ) * f.size * 0.2 } );
    }
    queueScorch( _p.x, f.floor, _p.z, f.size, f.spin * 7 );
    queueChunks( { x: _p.x, y: f.floor, z: _p.z, size: f.size, vx: f.vel.x, vz: f.vel.z } );
    _q.setFromAxisAngle( f.axis, f.spin * f.flight );
    queuePieces( {
        x: _p.x,
        y: f.floor + ( f.size / 2 ) * HEAD_LIFT,
        z: _p.z,
        qx: _q.x,
        qy: _q.y,
        qz: _q.z,
        qw: _q.w,
        scale: f.size / 2,
        vx: f.vel.x,
        vz: f.vel.z,
    } );
    shakeFrom( _p.x, f.floor, _p.z, ( num( 'Meteor.shake' ) * f.size ) / SHAKE_SIZE, SHAKE_REACH );
    d.lightAt = now;
    d.lightSize = f.size;
    d.lightX = _p.x;
    d.lightY = f.floor + f.size * 1.5;
    d.lightZ = _p.z;
}

export function advance( d: Director, f: Flight, now: number ): boolean {
    if ( ! f.live ) return false;
    const t = now - f.t0;
    if ( ! f.landed && t >= f.flight ) land( d, f, now );
    const done = isPit( f ) ? f.start.y + f.vel.y * t < PIT_DEPTH : t - f.flight > COLLAPSE;
    if ( done ) f.live = false;
    return f.live;
}

export function hide( m: ReadyMeshes, i: number ): void {
    m.heads.setMatrixAt( i, _zero );
    m.trails.setMatrixAt( i, _zero );
    m.glows.setMatrixAt( i, _zero );
}

export function draw( m: ReadyMeshes, f: Flight, i: number, now: number, gain: number ): void {
    const t = now - f.t0;
    const grounded = f.landed && ! isPit( f );
    const collapse = grounded ? Math.max( 0, 1 - ( t - f.flight ) / COLLAPSE ) : 1;
    _p.copy( f.start ).addScaledVector( f.vel, grounded ? f.flight : t );
    _q.setFromAxisAngle( f.axis, f.spin * t );
    m.heads.setMatrixAt( i, grounded ? _zero : _m.compose( _p, _q, _s.setScalar( f.size / 2 ) ) );
    const heat = m.heads.geometry.getAttribute( 'aMeteorHeat' ) as THREE.InstancedBufferAttribute;
    const vel = m.heads.geometry.getAttribute( 'aMeteorVel' ) as THREE.InstancedBufferAttribute;
    heat.setX( i, 1 + num( 'Meteor.build' ) * Math.min( 1, t / f.flight ) ** 2 );
    _dir.copy( f.vel ).normalize();
    vel.setXYZ( i, _dir.x, _dir.y, _dir.z );

    const width = f.size * TRAIL_WIDTH;
    _s.set( width, f.speed * TRAIL_SECONDS * collapse, width );
    m.trails.setMatrixAt( i, _m.compose( _p, f.tail, _s ) );
    m.trails.setColorAt( i, _c.setScalar( TRAIL_GAIN * gain ) );

    _s.setScalar( f.size * GLOW_SIZE * ( 0.4 + 0.6 * collapse ) );
    m.glows.setMatrixAt( i, _m.compose( _p, _q, _s ) );
    m.glows.setColorAt(
        i,
        _c
            .copy( CORE )
            .lerp( accent(), 0.3 )
            .multiplyScalar( GLOW_GAIN * gain * collapse ),
    );
}

export function commit( mesh: THREE.InstancedMesh, count: number ): void {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
    for ( const name of HEAD_ATTRIBUTES ) {
        const attribute = mesh.geometry.getAttribute( name );
        if ( attribute ) attribute.needsUpdate = true;
    }
}

export function flash( light: THREE.PointLight, d: Director, now: number ): void {
    light.position.set( d.lightX, d.lightY, d.lightZ );
    const fade = Math.max( 0, 1 - ( now - d.lightAt ) / COLLAPSE );
    light.intensity = LIGHT_GAIN * d.lightSize * fade * fade;
    light.color.copy( CORE ).lerp( accent(), 0.5 );
}
