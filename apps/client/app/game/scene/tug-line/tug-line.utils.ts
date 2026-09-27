import type { RootState } from '@react-three/fiber';
import type { TugEvent } from '@slur/shared';
import type { World } from 'koota';
import * as THREE from 'three';
import { Net, Render, Sim } from '../../ecs/traits';
import { accent } from '../accent';
import {
    coilAngle,
    coilRadius,
    payout,
    pixelsPerUnitAt1,
    reelDue,
    reelFade,
    reelOffset,
    reelPayout,
    ropeOffset,
    ropeWidth,
    throwSeconds,
    widthGlow,
} from './rope-curve.utils';
import type { Tether } from './tug-line';
import {
    BRIGHT,
    COIL_SEGMENTS,
    HOLD_S,
    HOOK_BRIGHT,
    HOOK_L,
    HOOK_W,
    LATE_S,
    LIFT,
    MAX,
    REEL_S,
    ROPE_SEGMENTS,
    ROPE_W,
    TOW_HOLD_S,
} from './tug-line.constants';
import { _a, _b, _c, _dir, _from, _hook, _o, _offset, _side, _start, _to, _up } from './tug-line.state';

export interface RopeView {
    cam: THREE.Vector3;
    pxPerUnit: number;
}

export function spawnTether( tethers: Tether[], e: TugEvent ): void {
    if ( tethers.length >= MAX ) tethers.shift();
    tethers.push( {
        ownerId: e.ownerId,
        targetId: e.targetId,
        dir: e.dir,
        x: e.x,
        y: e.y,
        z: e.z,
        age: 0,
        throwS: 0,
        reelAt: -1,
        pulled: false,
    } );
}

export function readView( state: RootState, view: RopeView ): void {
    view.cam.copy( state.camera.position );
    const fov = state.camera instanceof THREE.PerspectiveCamera ? state.camera.fov : 70;
    view.pxPerUnit = pixelsPerUnitAt1( state.gl.domElement.height, fov );
}

export function shipPosition( world: World, sessionId: string, out: THREE.Vector3 ): boolean {
    for ( const e of world.query( Net, Render ) ) {
        if ( e.get( Net )?.sessionId !== sessionId ) continue;
        const g = e.get( Render );
        if ( ! g ) return false;
        out.copy( g.position );
        out.y += LIFT;
        return true;
    }
    return false;
}

function holdSeconds( t: Tether ): number {
    return t.dir < 0 ? TOW_HOLD_S : HOLD_S;
}

function pullTimer( world: World, t: Tether ): number {
    for ( const e of world.query( Net, Sim ) ) {
        const id = e.get( Net )?.sessionId;
        const s = e.get( Sim );
        if ( ! s ) continue;
        if ( t.dir >= 0 && id === t.ownerId ) return s.tugTimer;
        if ( t.dir < 0 && id === t.targetId ) return s.towTimer;
    }
    return -1;
}

function updateReel( world: World, t: Tether ): void {
    if ( t.reelAt >= 0 ) return;
    const timer = pullTimer( world, t );
    if ( timer > 0 ) t.pulled = true;
    if ( reelDue( t.age, t.throwS, holdSeconds( t ), timer, t.pulled ) ) t.reelAt = t.age;
}

export function tetherDone( t: Tether ): boolean {
    const reelAt = t.reelAt >= 0 ? t.reelAt : holdSeconds( t ) + LATE_S;
    return t.age >= reelAt + REEL_S;
}

function ropeFrame(): void {
    _side.crossVectors( _dir, _up.set( 0, 1, 0 ) );
    if ( _side.lengthSq() < 1e-6 ) _side.set( 1, 0, 0 );
    _side.normalize();
    _up.crossVectors( _side, _dir ).normalize();
}

function coilPoint( frac: number, p: number, out: THREE.Vector3 ): THREE.Vector3 {
    const angle = coilAngle( frac, p );
    const r = coilRadius( frac, p );
    return out
        .copy( _from )
        .addScaledVector( _side, Math.cos( angle ) * r )
        .addScaledVector( _dir, Math.sin( angle ) * r );
}

function ropePoint( s: number, t: Tether, length: number, out: THREE.Vector3 ): THREE.Vector3 {
    if ( t.reelAt >= 0 ) reelOffset( s, t.age - t.reelAt, length, _offset );
    else ropeOffset( s, t.age, t.throwS, length, _offset );
    return out
        .copy( _start )
        .lerp( _hook, s )
        .addScaledVector( _side, _offset.side )
        .addScaledVector( _up, _offset.up );
}

function putSegment(
    mesh: THREE.InstancedMesh,
    i: number,
    base: number,
    glow: number,
    fade: number,
    view: RopeView,
): void {
    _o.position.copy( _a ).lerp( _b, 0.5 );
    const w = ropeWidth( base * ( 0.4 + 0.6 * fade ), _o.position.distanceTo( view.cam ), view.pxPerUnit );
    _o.lookAt( _b );
    _o.scale.set( w, w, _a.distanceTo( _b ) + w );
    _o.updateMatrix();
    mesh.setMatrixAt( i, _o.matrix );
    mesh.setColorAt( i, _c.copy( accent() ).multiplyScalar( glow * fade * widthGlow( base, w ) ) );
}

export function placeTether(
    world: World,
    mesh: THREE.InstancedMesh,
    start: number,
    t: Tether,
    view: RopeView,
): number {
    if ( ! shipPosition( world, t.ownerId, _from ) ) return 0;
    if ( t.targetId === '' || ! shipPosition( world, t.targetId, _to ) ) _to.set( t.x, t.y, t.z );
    const full = _from.distanceTo( _to );
    if ( full < 1e-3 ) return 0;
    if ( t.throwS === 0 ) t.throwS = throwSeconds( full );
    updateReel( world, t );
    const reeling = t.reelAt >= 0;
    const p = reeling ? reelPayout( t.age - t.reelAt ) : payout( t.age, t.throwS );
    const fade = reeling ? reelFade( t.age - t.reelAt ) : 1;
    _dir.subVectors( _to, _from ).divideScalar( full );
    ropeFrame();
    _hook.copy( _from ).addScaledVector( _dir, full * p );
    coilPoint( 0, p, _start );
    let n = start;
    ropePoint( 0, t, full * p, _a );
    for ( let i = 1; i <= ROPE_SEGMENTS; i++ ) {
        ropePoint( i / ROPE_SEGMENTS, t, full * p, _b );
        putSegment( mesh, n++, ROPE_W, BRIGHT, fade, view );
        _a.copy( _b );
    }
    if ( p < 1 ) {
        coilPoint( 0, p, _a );
        for ( let i = 1; i <= COIL_SEGMENTS; i++ ) {
            coilPoint( i / COIL_SEGMENTS, p, _b );
            putSegment( mesh, n++, ROPE_W, BRIGHT, fade, view );
            _a.copy( _b );
        }
    }
    _a.copy( _hook ).addScaledVector( _dir, -Math.min( HOOK_L, full * p ) );
    _b.copy( _hook );
    putSegment( mesh, n++, HOOK_W, HOOK_BRIGHT, fade, view );
    return n - start;
}
