import { classOfShip, DEFAULT_SHIP, HeldPower, POWER_SLOTS } from '@slur/shared';
import type { Entity, World } from 'koota';
import type * as THREE from 'three';
import { Held, Hover, LocalPlayer, Net, Render, Sim } from '../../ecs/traits';
import { selectedSlot } from '../../input/power-select';
import {
    _anchor,
    _from,
    _o,
    _to,
    ARC_LAYER,
    FLASH_LIFT,
    FLASH_S,
    FLASH_SCALE,
    GLYPH,
    LOOK,
    PULSE_S,
    SELECTED_SCALE,
} from './power-arc.constants';
import { type ArcLook, arcAnchor, easeOut, pulseScale, slotLook, slotPoint, takePickup } from './power-arc.utils';

export interface ArcFrame {
    mesh: THREE.InstancedMesh | null;
    prev: number[] | null;
    selected: number;
    pulse: number;
    flashSlot: number;
    flashAge: number;
}

export function createArcFrame(): ArcFrame {
    return { mesh: null, prev: null, selected: -1, pulse: PULSE_S, flashSlot: -1, flashAge: FLASH_S };
}

function put( look: ArcLook, i: number, cell: number, l: { gain: number; alpha: number } ): void {
    look.cell.setX( i, cell );
    look.gain.setX( i, l.gain );
    look.alpha.setX( i, l.alpha );
}

function commit( mesh: THREE.InstancedMesh, look: ArcLook, count: number ): void {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    look.cell.needsUpdate = true;
    look.gain.needsUpdate = true;
    look.alpha.needsUpdate = true;
}

function trackEdges( f: ArcFrame, slots: readonly number[], dt: number ): void {
    if ( f.prev ) {
        const picked = takePickup( f.prev, slots );
        if ( picked >= 0 ) {
            f.flashSlot = picked;
            f.flashAge = 0;
        }
    } else f.prev = Array.from( slots );
    const sel = selectedSlot();
    if ( sel !== f.selected ) {
        if ( f.selected >= 0 ) f.pulse = 0;
        f.selected = sel;
    }
    f.pulse = Math.min( PULSE_S, f.pulse + dt );
    f.flashAge = Math.min( FLASH_S, f.flashAge + dt );
}

function flyingSlot( f: ArcFrame, slots: readonly number[] ): number {
    if ( f.flashAge >= FLASH_S ) return -1;
    return ( slots[ f.flashSlot ] ?? HeldPower.none ) === HeldPower.none ? -1 : f.flashSlot;
}

function drawSlots( f: ArcFrame, mesh: THREE.InstancedMesh, look: ArcLook, slots: readonly number[], flying: number ) {
    for ( let i = 0; i < POWER_SLOTS; i++ ) {
        const power = i === flying ? HeldPower.none : ( slots[ i ] ?? HeldPower.none );
        const selected = i === f.selected;
        slotPoint( _anchor, i, _o.position );
        _o.scale.setScalar( GLYPH * ( selected ? SELECTED_SCALE * pulseScale( f.pulse / PULSE_S ) : 1 ) );
        _o.updateMatrix();
        mesh.setMatrixAt( i, _o.matrix );
        put( look, i, power, slotLook( power, selected ) );
    }
}

function drawFlash( f: ArcFrame, mesh: THREE.InstancedMesh, look: ArcLook, power: number, ship: THREE.Vector3 ) {
    const k = easeOut( f.flashAge / FLASH_S );
    _from.set( ship.x, _anchor.y + FLASH_LIFT, ship.z );
    slotPoint( _anchor, f.flashSlot, _to );
    _o.position.lerpVectors( _from, _to, k );
    _o.scale.setScalar( GLYPH * ( FLASH_SCALE + ( 1 - FLASH_SCALE ) * k ) );
    _o.updateMatrix();
    mesh.setMatrixAt( POWER_SLOTS, _o.matrix );
    put( look, POWER_SLOTS, power, LOOK.flash );
}

function localShip( world: World ): Entity | undefined {
    const e = world.queryFirst( LocalPlayer, Held, Render, Sim );
    return e && ! e.get( Sim )?.dead ? e : undefined;
}

export function stepArc( f: ArcFrame, look: ArcLook, world: World, camera: THREE.Camera, dt: number ): void {
    const mesh = f.mesh;
    if ( ! mesh ) return;
    camera.layers.enable( ARC_LAYER );
    const e = localShip( world );
    const slots = e?.get( Held )?.slots;
    const p = e?.get( Render )?.position;
    if ( ! e || ! slots || ! p ) {
        mesh.count = 0;
        return;
    }
    trackEdges( f, slots, dt );
    const groundY = p.y - ( e.get( Hover )?.applied ?? 0 );
    arcAnchor( p, groundY, classOfShip( e.get( Net )?.shipId ?? DEFAULT_SHIP ).tuning.halfL, _anchor );
    _o.quaternion.copy( camera.quaternion );
    const flying = flyingSlot( f, slots );
    drawSlots( f, mesh, look, slots, flying );
    if ( flying >= 0 ) drawFlash( f, mesh, look, slots[ flying ] ?? HeldPower.none, p );
    commit( mesh, look, flying >= 0 ? POWER_SLOTS + 1 : POWER_SLOTS );
}
