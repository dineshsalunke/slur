import type { PortalState } from '@slur/shared';
import * as THREE from 'three';
import { accent } from '../accent';
import { archGeometry, archSleeveGeometry, boxPart, mergeParts } from '../portal-ring';
import { graphiteSurface } from '../track-materials';
import {
    _c,
    _o,
    FOOT_DEPTH,
    FOOT_TOP,
    FOOT_WIDTH,
    FOOT_X,
    GATE_LEG,
    GATE_RING,
    GATE_SLEEVE,
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
    PORTAL_ARMED_INTENSITY,
    PORTAL_IDLE_INTENSITY,
    PORTAL_PULSE_DEPTH,
    PORTAL_PULSE_HZ,
} from './portal-field.constants';

export type PortalEndSink = ( x: number, y: number, z: number, live: boolean, marks: number ) => void;

export interface PortalLook {
    shell: THREE.BufferGeometry;
    sleeve: THREE.BufferGeometry;
    mark: THREE.BufferGeometry;
    metal: THREE.MeshStandardMaterial;
    glow: THREE.MeshBasicMaterial;
}

export interface PortalFrame {
    shell: THREE.InstancedMesh | null;
    sleeve: THREE.InstancedMesh | null;
    mark: THREE.InstancedMesh | null;
    ends: number;
    marks: number;
    t: number;
}

export function gateShellGeometry(): THREE.BufferGeometry {
    return mergeParts( [
        archGeometry( GATE_RING, GATE_LEG ),
        boxPart( FOOT_WIDTH, FOOT_TOP, FOOT_DEPTH, -FOOT_X, FOOT_TOP / 2, 0 ),
        boxPart( FOOT_WIDTH, FOOT_TOP, FOOT_DEPTH, FOOT_X, FOOT_TOP / 2, 0 ),
        boxPart( LUG_WIDTH, LUG_HEIGHT, LUG_DEPTH, 0, LUG_Y, 0 ),
    ] );
}

export function gateSleeveGeometry(): THREE.BufferGeometry {
    return archSleeveGeometry( GATE_RING, GATE_SLEEVE, GATE_LEG );
}

export function buildPortalLook(): PortalLook {
    return {
        shell: gateShellGeometry(),
        sleeve: gateSleeveGeometry(),
        mark: new THREE.BoxGeometry( MARK_WIDTH, MARK_HEIGHT, MARK_DEPTH ).translate( 0, LUG_Y, 0 ),
        metal: new THREE.MeshStandardMaterial( graphiteSurface() ),
        glow: new THREE.MeshBasicMaterial(),
    };
}

export function disposePortalLook( look: PortalLook ): void {
    look.shell.dispose();
    look.sleeve.dispose();
    look.mark.dispose();
    look.metal.dispose();
    look.glow.dispose();
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
    const { shell, sleeve, mark } = frame;
    if ( ! shell || ! sleeve || ! mark || frame.ends >= MAX_PORTAL_ENDS ) return;
    const i = frame.ends++;
    _c.copy( accent() ).multiplyScalar( portalGlow( live, frame.t ) );
    _o.position.set( x, y, z );
    _o.updateMatrix();
    shell.setMatrixAt( i, _o.matrix );
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
