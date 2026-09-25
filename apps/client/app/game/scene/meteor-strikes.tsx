import { useFrame } from '@react-three/fiber';
import type { Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { blockWorld } from '../block-state';
import { shakeFrom } from '../camera/shake';
import { LocalPlayer, Sim } from '../ecs/traits';
import { accent } from './accent';
import { asteroidGeometry } from './asteroid-geometry';
import { queueBurst } from './block-burst';
import { trackGround } from './debris-ground';
import type { DebrisGround } from './debris-physics';
import { FRACTURE_CORE_HEX } from './fractured-block-shader';
import { pushHit } from './hit-events';
import { meteorTrailGeometry } from './meteor-assets';
import { queueChunks } from './meteor-chunks';
import { STRIKE_SPACING, type Strike, strikeAt, strikeWindow } from './meteor-schedule';
import { queueScorch } from './meteor-scorch';

const FLIGHTS = 6;
const HEAD_SEED = 0x3e7e_0a11;
const HEAD_DETAIL = 5;
const TRAIL_SECONDS = 0.36;
const TRAIL_WIDTH = 0.55;
const TRAIL_GAIN = 2.2;
const GLOW_SIZE = 0.78;
const GLOW_GAIN = 0.9;
const COLLAPSE = 0.16;
const MIN_LEAD = 0.55;
const MIN_SPEED = 30;
const PIT_DEPTH = -160;
const SCAN = 6;
const SHAKE_REACH = 80;
const SHAKE_SIZE = 3.5;
const LIGHT_DISTANCE = 110;
const LIGHT_GAIN = 700;
const LIGHT_DECAY = 0.3;
const LIGHT_END = 1.8;
const BURST_SIZE = 3.2;
const SPARK_BURSTS = 3;

interface Flight {
    live: boolean;
    landed: boolean;
    t0: number;
    flight: number;
    start: THREE.Vector3;
    vel: THREE.Vector3;
    tail: THREE.Quaternion;
    axis: THREE.Vector3;
    floor: number;
    size: number;
    spin: number;
    speed: number;
}

interface Director {
    flights: Flight[];
    ground: DebrisGround;
    cursor: number;
    lastZ: number;
    lightAt: number;
    lightSize: number;
    lightX: number;
    lightY: number;
    lightZ: number;
}

interface Meshes {
    heads: THREE.InstancedMesh | null;
    trails: THREE.InstancedMesh | null;
    glows: THREE.InstancedMesh | null;
}

interface ReadyMeshes {
    heads: THREE.InstancedMesh;
    trails: THREE.InstancedMesh;
    glows: THREE.InstancedMesh;
}

const UP = new THREE.Vector3( 0, 1, 0 );
const CORE = new THREE.Color( FRACTURE_CORE_HEX );
const _p = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _c = new THREE.Color();
const _zero = new THREE.Matrix4().makeScale( 0, 0, 0 );

function makeFlight(): Flight {
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

function makeDirector( ground: DebrisGround ): Director {
    return {
        flights: Array.from( { length: FLIGHTS }, makeFlight ),
        ground,
        cursor: 0,
        lastZ: Number.NaN,
        lightAt: -99,
        lightSize: 0,
        lightX: 0,
        lightY: 0,
        lightZ: 0,
    };
}

function isPit( f: Flight ): boolean {
    return f.floor === Number.NEGATIVE_INFINITY;
}

function launch( d: Director, s: Strike, now: number ): void {
    const f = d.flights.find( ( x ) => ! x.live );
    if ( ! f ) return;
    const speed = num( 'Meteor.speed' );
    const flight = num( 'Meteor.flight' );
    const floor = d.ground.floor( s.x, s.z, 60 );
    f.live = true;
    f.landed = false;
    f.t0 = now;
    f.flight = flight;
    f.floor = floor;
    f.size = s.size * num( 'Meteor.size' );
    f.spin = s.spin;
    f.speed = speed;
    f.vel.set( -s.fromX, -s.fromY, -s.fromZ ).multiplyScalar( speed );
    f.start.set( s.x, isPit( f ) ? 0 : floor, s.z ).addScaledVector( f.vel, -flight );
    f.tail.setFromUnitVectors( UP, _dir.set( s.fromX, s.fromY, s.fromZ ) );
    f.axis.set( s.fromZ, s.fromX, -s.fromY ).normalize();
}

function schedule( d: Director, z: number, vz: number, now: number ): void {
    if ( Number.isNaN( d.lastZ ) || z < d.lastZ - STRIKE_SPACING ) d.cursor = Math.floor( z / STRIKE_SPACING ) + 1;
    d.lastZ = z;
    const v = Math.max( MIN_SPEED, vz );
    const flight = num( 'Meteor.flight' );
    const lead = v * flight + num( 'Meteor.ahead' );
    const soonest = v * flight * MIN_LEAD;
    const chance = num( 'Meteor.chance' );
    for ( let guard = 0; guard < SCAN; guard++ ) {
        if ( strikeWindow( d.cursor ) - STRIKE_SPACING > z + lead ) return;
        const s = strikeAt( d.cursor, chance );
        if ( s && s.z - z > lead ) return;
        d.cursor++;
        if ( s && s.z - z >= soonest ) launch( d, s, now );
    }
}

function land( d: Director, f: Flight, now: number ): void {
    f.landed = true;
    if ( isPit( f ) ) return;
    _p.copy( f.start ).addScaledVector( f.vel, f.flight );
    queueBurst( _p.x, f.floor + f.size * 0.4, _p.z, f.size * BURST_SIZE );
    for ( let k = 0; k < SPARK_BURSTS; k++ ) {
        pushHit( { x: _p.x + ( k - 1 ) * f.size * 0.4, y: f.floor + 0.3, z: _p.z + ( k - 1 ) * f.size * 0.2 } );
    }
    queueScorch( _p.x, f.floor, _p.z, f.size, f.spin * 7 );
    queueChunks( { x: _p.x, y: f.floor, z: _p.z, size: f.size, vx: f.vel.x, vz: f.vel.z } );
    shakeFrom( _p.x, f.floor, _p.z, ( num( 'Meteor.shake' ) * f.size ) / SHAKE_SIZE, SHAKE_REACH );
    d.lightAt = now;
    d.lightSize = f.size;
    d.lightX = _p.x;
    d.lightY = f.floor + f.size * 1.5;
    d.lightZ = _p.z;
}

function advance( d: Director, f: Flight, now: number ): boolean {
    if ( ! f.live ) return false;
    const t = now - f.t0;
    if ( ! f.landed && t >= f.flight ) land( d, f, now );
    const done = isPit( f ) ? f.start.y + f.vel.y * t < PIT_DEPTH : t - f.flight > COLLAPSE;
    if ( done ) f.live = false;
    return f.live;
}

function hide( m: ReadyMeshes, i: number ): void {
    m.heads.setMatrixAt( i, _zero );
    m.trails.setMatrixAt( i, _zero );
    m.glows.setMatrixAt( i, _zero );
}

function draw( m: ReadyMeshes, f: Flight, i: number, now: number, gain: number ): void {
    const t = now - f.t0;
    const grounded = f.landed && ! isPit( f );
    const collapse = grounded ? Math.max( 0, 1 - ( t - f.flight ) / COLLAPSE ) : 1;
    _p.copy( f.start ).addScaledVector( f.vel, grounded ? f.flight : t );
    _q.setFromAxisAngle( f.axis, f.spin * t );
    m.heads.setMatrixAt( i, grounded ? _zero : _m.compose( _p, _q, _s.setScalar( f.size / 2 ) ) );

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

function commit( mesh: THREE.InstancedMesh, count: number ): void {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}

function flash( light: THREE.PointLight, d: Director, now: number ): void {
    light.position.set( d.lightX, d.lightY, d.lightZ );
    const fade = Math.max( 0, 1 - ( now - d.lightAt ) / LIGHT_END );
    light.intensity = LIGHT_GAIN * d.lightSize * Math.exp( -( now - d.lightAt ) / LIGHT_DECAY ) * fade * fade;
    light.color.copy( CORE ).lerp( accent(), 0.5 );
}

export function MeteorStrikes( { track, material }: { track: Track; material: THREE.Material } ) {
    const world = useWorld();
    const director = useMemo( () => makeDirector( trackGround( track, blockWorld.broken ) ), [ track ] );
    const head = useMemo( () => {
        const g = asteroidGeometry( HEAD_SEED, HEAD_DETAIL );
        g.setAttribute( 'aRockHeat', new THREE.InstancedBufferAttribute( new Float32Array( FLIGHTS ).fill( 1 ), 1 ) );
        return g;
    }, [] );
    const trail = useMemo( meteorTrailGeometry, [] );
    const glow = useMemo( () => new THREE.IcosahedronGeometry( 1, 2 ), [] );
    const meshes = useRef< Meshes >( { heads: null, trails: null, glows: null } );
    const lightRef = useRef< THREE.PointLight | null >( null );

    // JUSTIFIED EFFECT — brackets the lifetime of GPU geometry we built ourselves.
    useEffect(
        () => () => {
            head.dispose();
            trail.dispose();
            glow.dispose();
        },
        [ head, trail, glow ],
    );

    useFrame( ( state ) => {
        const { heads, trails, glows } = meshes.current;
        if ( ! heads || ! trails || ! glows ) return;
        const m = meshes.current as ReadyMeshes;
        const now = state.clock.elapsedTime;
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        if ( sim ) schedule( director, sim.z, sim.vz, now );
        const gain = num( 'Meteor.trail' );
        let top = 0;
        for ( let i = 0; i < FLIGHTS; i++ ) {
            const f = director.flights[ i ];
            if ( ! advance( director, f, now ) ) {
                hide( m, i );
                continue;
            }
            top = i + 1;
            draw( m, f, i, now, gain );
        }
        commit( heads, top );
        commit( trails, top );
        commit( glows, top );
        if ( lightRef.current ) flash( lightRef.current, director, now );
    } );

    return (
        <Fragment>
            <instancedMesh
                ref={ ( x ) => {
                    meshes.current.heads = x;
                } }
                args={ [ head, material, FLIGHTS ] }
                count={ 0 }
                frustumCulled={ false }
            />
            <instancedMesh
                ref={ ( x ) => {
                    meshes.current.trails = x;
                    if ( x ) x.setColorAt( 0, _c.setRGB( 0, 0, 0 ) );
                } }
                args={ [ trail, undefined, FLIGHTS ] }
                count={ 0 }
                frustumCulled={ false }
            >
                <meshBasicMaterial
                    vertexColors
                    transparent
                    depthWrite={ false }
                    blending={ THREE.AdditiveBlending }
                    side={ THREE.DoubleSide }
                    fog={ false }
                />
            </instancedMesh>
            <instancedMesh
                ref={ ( x ) => {
                    meshes.current.glows = x;
                    if ( x ) x.setColorAt( 0, _c.setRGB( 0, 0, 0 ) );
                } }
                args={ [ glow, undefined, FLIGHTS ] }
                count={ 0 }
                frustumCulled={ false }
            >
                <meshBasicMaterial transparent depthWrite={ false } blending={ THREE.AdditiveBlending } fog={ false } />
            </instancedMesh>
            <pointLight ref={ lightRef } intensity={ 0 } distance={ LIGHT_DISTANCE } decay={ 2 } />
        </Fragment>
    );
}
