import { HeldPower, POWER_SLOTS } from '@slur/shared';
import * as THREE from 'three';
import { glyphAtlas } from './glyph-atlas';
import { DROP, FRAGMENT, GAP, INSTANCES, LOOK, MIN_BACK, PITCH, PULSE, SAG, VERTEX } from './power-arc.constants';

const MID = ( POWER_SLOTS - 1 ) / 2;

export interface ArcLook {
    geometry: THREE.PlaneGeometry;
    material: THREE.ShaderMaterial;
    texture: THREE.CanvasTexture;
    cell: THREE.InstancedBufferAttribute;
    gain: THREE.InstancedBufferAttribute;
    alpha: THREE.InstancedBufferAttribute;
}

function perInstance(): THREE.InstancedBufferAttribute {
    return new THREE.InstancedBufferAttribute( new Float32Array( INSTANCES ), 1 ).setUsage( THREE.DynamicDrawUsage );
}

export function buildArcLook(): ArcLook {
    const texture = glyphAtlas();
    const cell = perInstance();
    const gain = perInstance();
    const alpha = perInstance();
    const geometry = new THREE.PlaneGeometry( 1, 1 );
    geometry.setAttribute( 'aCell', cell );
    geometry.setAttribute( 'aGain', gain );
    geometry.setAttribute( 'aAlpha', alpha );
    const material = new THREE.ShaderMaterial( {
        uniforms: { uMap: { value: texture } },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthTest: false,
        depthWrite: false,
    } );
    return { geometry, material, texture, cell, gain, alpha };
}

export function disposeArcLook( look: ArcLook ): void {
    look.geometry.dispose();
    look.material.dispose();
    look.texture.dispose();
}

export function arcAnchor( ship: THREE.Vector3, groundY: number, halfL: number, out: THREE.Vector3 ): THREE.Vector3 {
    return out.set( ship.x, groundY + DROP, ship.z - Math.max( halfL + GAP, MIN_BACK ) );
}

export function slotPoint( anchor: THREE.Vector3, slot: number, out: THREE.Vector3 ): THREE.Vector3 {
    const u = MID - slot;
    return out.set( anchor.x + u * PITCH, anchor.y + SAG * u * u, anchor.z );
}

export function takePickup( prev: number[], next: readonly number[] ): number {
    let picked = -1;
    for ( let i = 0; i < POWER_SLOTS; i++ ) {
        const now = next[ i ] ?? HeldPower.none;
        if ( picked < 0 && ( prev[ i ] ?? HeldPower.none ) === HeldPower.none && now !== HeldPower.none ) picked = i;
        prev[ i ] = now;
    }
    return picked;
}

export function easeOut( f: number ): number {
    const r = 1 - Math.min( 1, Math.max( 0, f ) );
    return 1 - r * r * r;
}

export function pulseScale( f: number ): number {
    return 1 + PULSE * ( 1 - Math.min( 1, Math.max( 0, f ) ) );
}

export function slotLook( power: number, selected: boolean ): { gain: number; alpha: number } {
    if ( power === HeldPower.none ) return selected ? LOOK.emptySelected : LOOK.empty;
    return selected ? LOOK.selected : LOOK.held;
}
