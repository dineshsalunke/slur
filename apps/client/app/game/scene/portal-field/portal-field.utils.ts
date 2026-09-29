import type { PortalState } from '@slur/shared';
import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { accent } from '../accent';
import { boxPart, mergeParts, ringGeometry, ringSleeveGeometry } from '../portal-ring';
import { graphiteSurface } from '../track-materials';
import { buildMembraneMaterial, membraneGeometry } from './membrane-material';
import {
    GATE_RING,
    GATE_SLEEVE,
    GATE_Y,
    LUG_DEPTH,
    LUG_HEIGHT,
    LUG_WIDTH,
    LUG_Y,
    MARK_DEPTH,
    MARK_HEIGHT,
    MARK_OFFSETS,
    MARK_WIDTH,
    MAX_PORTAL_ENDS,
    MAX_PORTAL_MARKS,
    MEMBRANE,
    MEMBRANE_SEGMENTS,
    PORTAL_ARMED_INTENSITY,
    PORTAL_IDLE_INTENSITY,
    PORTAL_PULSE_DEPTH,
    PORTAL_PULSE_HZ,
} from './portal-field.constants';
import { _c, _o } from './portal-field.scratch';

export type PortalEndSink = ( x: number, y: number, z: number, live: boolean, marks: number ) => void;

export interface PortalLook {
    shell: THREE.BufferGeometry;
    sleeve: THREE.BufferGeometry;
    mark: THREE.BufferGeometry;
    membrane: THREE.BufferGeometry;
    metal: THREE.MeshStandardMaterial;
    glow: THREE.MeshBasicMaterial;
    film: THREE.ShaderMaterial;
}

export interface PortalFrame {
    shell: THREE.InstancedMesh | null;
    sleeve: THREE.InstancedMesh | null;
    membrane: THREE.InstancedMesh | null;
    mark: THREE.InstancedMesh | null;
    ends: number;
    marks: number;
    t: number;
}

export function gateShellGeometry(): THREE.BufferGeometry {
    return mergeParts( [
        ringGeometry( GATE_RING ).translate( 0, GATE_Y, 0 ),
        boxPart( LUG_WIDTH, LUG_HEIGHT, LUG_DEPTH, 0, LUG_Y, 0 ),
    ] );
}

export function gateSleeveGeometry(): THREE.BufferGeometry {
    return ringSleeveGeometry( GATE_RING, GATE_SLEEVE ).translate( 0, GATE_Y, 0 );
}

export function buildPortalLook(): PortalLook {
    return {
        shell: gateShellGeometry(),
        sleeve: gateSleeveGeometry(),
        mark: new THREE.BoxGeometry( MARK_WIDTH, MARK_HEIGHT, MARK_DEPTH ).translate( 0, LUG_Y, 0 ),
        membrane: membraneGeometry( MEMBRANE, MEMBRANE_SEGMENTS ),
        metal: new THREE.MeshStandardMaterial( graphiteSurface() ),
        glow: new THREE.MeshBasicMaterial(),
        film: buildMembraneMaterial( MEMBRANE ),
    };
}

export function disposePortalLook( look: PortalLook ): void {
    look.shell.dispose();
    look.sleeve.dispose();
    look.mark.dispose();
    look.membrane.dispose();
    look.metal.dispose();
    look.glow.dispose();
    look.film.dispose();
}

export function tuneMembrane( film: THREE.ShaderMaterial, t: number ): void {
    film.uniforms.uTime.value = t;
    film.uniforms.uOpacity.value = num( 'Portal.membraneOpacity' );
    film.uniforms.uGlow.value = num( 'Portal.membraneGlow' );
    film.uniforms.uFlow.value = num( 'Portal.membraneFlow' );
}

export function collectPortalEnds( portals: Iterable< PortalState >, sink: PortalEndSink ): void {
    for ( const p of portals ) {
        if ( p.ends < 1 ) continue;
        const paired = p.ends >= 2;
        sink( p.ax, p.ay, p.az, paired && p.armA, 1 );
        if ( paired ) sink( p.bx, p.by, p.bz, p.armB, 2 );
    }
}

export function portalGlow( live: boolean, t: number ): number {
    if ( ! live ) return PORTAL_IDLE_INTENSITY;
    return (
        PORTAL_ARMED_INTENSITY *
        ( 1 - PORTAL_PULSE_DEPTH * ( 0.5 + 0.5 * Math.sin( t * PORTAL_PULSE_HZ * Math.PI * 2 ) ) )
    );
}

export function writePortalEnd(
    frame: PortalFrame,
    x: number,
    y: number,
    z: number,
    live: boolean,
    marks: number,
): void {
    const { shell, sleeve, membrane, mark } = frame;
    if ( ! shell || ! sleeve || ! membrane || ! mark || frame.ends >= MAX_PORTAL_ENDS ) return;
    const i = frame.ends++;
    const glow = portalGlow( live, frame.t );
    _o.position.set( x, y, z );
    _o.updateMatrix();
    shell.setMatrixAt( i, _o.matrix );
    membrane.setMatrixAt( i, _o.matrix );
    _c.copy( accent() ).multiplyScalar( glow / PORTAL_ARMED_INTENSITY );
    membrane.setColorAt( i, _c );
    _c.copy( accent() ).multiplyScalar( glow );
    sleeve.setMatrixAt( i, _o.matrix );
    sleeve.setColorAt( i, _c );
    for ( const dx of MARK_OFFSETS[ marks - 1 ] ) {
        if ( frame.marks >= MAX_PORTAL_MARKS ) return;
        _o.position.set( x + dx, y, z );
        _o.updateMatrix();
        mark.setMatrixAt( frame.marks, _o.matrix );
        mark.setColorAt( frame.marks++, _c );
    }
}
