import { DEFAULT_PORTAL_CONFIG, type PortalState } from '@slur/shared';
import * as THREE from 'three';
import {
    PORTAL_ARMED_INTENSITY,
    PORTAL_IDLE_INTENSITY,
    PORTAL_PULSE_DEPTH,
    PORTAL_PULSE_HZ,
    PORTAL_RING_TUBE,
} from './portal-field.constants';

export type PortalEndSink = ( x: number, y: number, z: number, live: boolean ) => void;

export function buildPortalLook() {
    return {
        geometry: new THREE.TorusGeometry( DEFAULT_PORTAL_CONFIG.portalR, PORTAL_RING_TUBE, 10, 48 ),
        material: new THREE.MeshBasicMaterial( {
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        } ),
    };
}

export function collectPortalEnds( portals: Iterable< PortalState >, sink: PortalEndSink ): void {
    for ( const p of portals ) {
        if ( p.ends < 1 ) continue;
        const paired = p.ends >= 2;
        sink( p.ax, p.ay, p.az, paired && p.armA );
        if ( paired ) sink( p.bx, p.by, p.bz, p.armB );
    }
}

export function portalGlow( live: boolean, t: number ): number {
    if ( ! live ) return PORTAL_IDLE_INTENSITY;
    return (
        PORTAL_ARMED_INTENSITY *
        ( 1 - PORTAL_PULSE_DEPTH * ( 0.5 + 0.5 * Math.sin( t * PORTAL_PULSE_HZ * Math.PI * 2 ) ) )
    );
}
