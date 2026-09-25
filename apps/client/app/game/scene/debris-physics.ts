import * as THREE from 'three';

export const HULL_LIMIT = 40;

const REST_SPEED = 2.5;
const SLEEP_SPEED_SQ = 0.35;
const SLEEP_SPIN_SQ = 0.3;
const SLEEP_AFTER = 0.3;
const CONTACT_PASSES = 2;

export interface DebrisParams {
    gravity: number;
    bounce: number;
    friction: number;
    spinDrag: number;
}

export interface DebrisGround {
    floor( x: number, z: number, top: number ): number;
    walls( body: DebrisBody, bounce: number ): void;
}

export interface DebrisBody {
    live: boolean;
    asleep: boolean;
    p: THREE.Vector3;
    v: THREE.Vector3;
    w: THREE.Vector3;
    q: THREE.Quaternion;
    inv: THREE.Vector3;
    hull: Float32Array;
    count: number;
    reach: number;
    rest: number;
    age: number;
    slam: number;
    contact: THREE.Vector3;
}

export function makeBody(): DebrisBody {
    return {
        live: false,
        asleep: false,
        p: new THREE.Vector3(),
        v: new THREE.Vector3(),
        w: new THREE.Vector3(),
        q: new THREE.Quaternion(),
        inv: new THREE.Vector3( 1, 1, 1 ),
        hull: new Float32Array( HULL_LIMIT * 3 ),
        count: 0,
        reach: 1,
        rest: 0,
        age: 0,
        slam: 0,
        contact: new THREE.Vector3(),
    };
}

export function resetBody( b: DebrisBody ): void {
    b.live = true;
    b.asleep = false;
    b.v.set( 0, 0, 0 );
    b.w.set( 0, 0, 0 );
    b.q.identity();
    b.count = 0;
    b.reach = 0;
    b.rest = 0;
    b.age = 0;
    b.slam = 0;
}

export function addHullPoint( b: DebrisBody, x: number, y: number, z: number ): void {
    if ( b.count >= HULL_LIMIT ) return;
    const i = b.count * 3;
    b.hull[ i ] = x;
    b.hull[ i + 1 ] = y;
    b.hull[ i + 2 ] = z;
    b.count++;
    b.reach = Math.max( b.reach, Math.hypot( x, y, z ) );
}

export function setBoxInertia( b: DebrisBody, w: number, h: number, d: number ): void {
    const ww = w * w;
    const hh = h * h;
    const dd = d * d;
    b.inv.set( 12 / Math.max( 1e-4, hh + dd ), 12 / Math.max( 1e-4, ww + dd ), 12 / Math.max( 1e-4, ww + hh ) );
}

const _r = new THREE.Vector3();
const _vel = new THREE.Vector3();
const _arm = new THREE.Vector3();
const _turn = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _j = new THREE.Vector3();
const _conj = new THREE.Quaternion();
const _spin = new THREE.Quaternion();

function worldInverseInertia( b: DebrisBody, vec: THREE.Vector3, out: THREE.Vector3 ): THREE.Vector3 {
    _conj.copy( b.q ).invert();
    return out.copy( vec ).applyQuaternion( _conj ).multiply( b.inv ).applyQuaternion( b.q );
}

function velocityAt( b: DebrisBody, r: THREE.Vector3, out: THREE.Vector3 ): THREE.Vector3 {
    return out.crossVectors( b.w, r ).add( b.v );
}

function applyImpulse( b: DebrisBody, r: THREE.Vector3, j: THREE.Vector3 ): void {
    b.v.add( j );
    _arm.crossVectors( r, j );
    b.w.add( worldInverseInertia( b, _arm, _turn ) );
}

function effectiveMass( b: DebrisBody, r: THREE.Vector3, n: THREE.Vector3 ): number {
    _arm.crossVectors( r, n );
    worldInverseInertia( b, _arm, _turn );
    _arm.crossVectors( _turn, r );
    return 1 + n.dot( _arm );
}

const UP = new THREE.Vector3( 0, 1, 0 );

function integrate( b: DebrisBody, h: number, p: DebrisParams ): void {
    b.v.y -= p.gravity * h;
    b.p.addScaledVector( b.v, h );
    _spin.set( b.w.x * h * 0.5, b.w.y * h * 0.5, b.w.z * h * 0.5, 0 ).multiply( b.q );
    b.q.set( b.q.x + _spin.x, b.q.y + _spin.y, b.q.z + _spin.z, b.q.w + _spin.w ).normalize();
    b.w.multiplyScalar( Math.max( 0, 1 - p.spinDrag * h ) );
}

function rub( b: DebrisBody, r: THREE.Vector3, jn: number, friction: number ): void {
    velocityAt( b, r, _vel );
    const vt = Math.hypot( _vel.x, _vel.z );
    if ( vt < 1e-4 ) return;
    _dir.set( _vel.x / vt, 0, _vel.z / vt );
    const jt = Math.min( vt / effectiveMass( b, r, _dir ), friction * jn );
    applyImpulse( b, r, _j.copy( _dir ).multiplyScalar( -jt ) );
}

function touch( b: DebrisBody, i: number, floor: number, p: DebrisParams, first: boolean ): number {
    _r.set( b.hull[ i * 3 ], b.hull[ i * 3 + 1 ], b.hull[ i * 3 + 2 ] ).applyQuaternion( b.q );
    const pen = floor - ( b.p.y + _r.y );
    if ( pen <= 0 ) return 0;
    velocityAt( b, _r, _vel );
    const vn = _vel.y;
    if ( vn >= 0 ) return pen;
    const e = vn < -REST_SPEED ? p.bounce : 0;
    const jn = ( -( 1 + e ) * vn ) / effectiveMass( b, _r, UP );
    applyImpulse( b, _r, _j.set( 0, jn, 0 ) );
    if ( first && jn > b.slam ) {
        b.slam = jn;
        b.contact.set( b.p.x + _r.x, floor, b.p.z + _r.z );
    }
    rub( b, _r, jn, p.friction );
    return pen;
}

function resolveFloor( b: DebrisBody, floor: number, p: DebrisParams ): boolean {
    let deepest = 0;
    for ( let pass = 0; pass < CONTACT_PASSES; pass++ ) {
        for ( let i = 0; i < b.count; i++ ) deepest = Math.max( deepest, touch( b, i, floor, p, pass === 0 ) );
    }
    if ( deepest > 0 ) b.p.y += deepest;
    return deepest > 0;
}

export function stepBody( b: DebrisBody, h: number, p: DebrisParams, ground: DebrisGround ): void {
    if ( ! b.live || b.asleep ) return;
    b.age += h;
    integrate( b, h, p );
    ground.walls( b, p.bounce );
    const floor = ground.floor( b.p.x, b.p.z, b.p.y + b.reach * 0.25 );
    const touching = floor > Number.NEGATIVE_INFINITY && resolveFloor( b, floor, p );
    if ( touching && b.v.lengthSq() < SLEEP_SPEED_SQ && b.w.lengthSq() < SLEEP_SPIN_SQ ) {
        b.rest += h;
        if ( b.rest > SLEEP_AFTER ) {
            b.asleep = true;
            b.v.set( 0, 0, 0 );
            b.w.set( 0, 0, 0 );
        }
    } else b.rest = 0;
}

export function lowestHullY( b: DebrisBody ): number {
    let low = Number.POSITIVE_INFINITY;
    for ( let i = 0; i < b.count; i++ ) {
        _r.set( b.hull[ i * 3 ], b.hull[ i * 3 + 1 ], b.hull[ i * 3 + 2 ] ).applyQuaternion( b.q );
        low = Math.min( low, b.p.y + _r.y );
    }
    return low;
}
