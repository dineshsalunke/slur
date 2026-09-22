import type * as THREE from 'three';
import { num } from '../../dev/tunables';

export const ENGINE_MATERIAL = 'Engine_core';
export const ACCENT_MATERIAL = 'Marigold_emission';

export interface ShipMaterialTuning {
    engineIdle: number;
    engineCruise: number;
    accent: number;
    hullRoughness: number;
    hullEnvMap: number;
}

const scratch: ShipMaterialTuning = {
    engineIdle: 0,
    engineCruise: 0,
    accent: 0,
    hullRoughness: 0,
    hullEnvMap: 0,
};

export function shipMaterialTuning(): ShipMaterialTuning {
    scratch.engineIdle = num( 'ship.engineIdle' );
    scratch.engineCruise = num( 'ship.engineCruise' );
    scratch.accent = num( 'ship.accentEmissive' );
    scratch.hullRoughness = num( 'ship.hullRoughness' );
    scratch.hullEnvMap = num( 'ship.hullEnvMap' );
    return scratch;
}

export function engineIntensity( t: ShipMaterialTuning, speed: number ): number {
    const s = speed < 0 ? 0 : speed > 1 ? 1 : speed;
    return t.engineIdle + ( t.engineCruise - t.engineIdle ) * s;
}

export function applyShipSurface( mat: THREE.MeshStandardMaterial, t: ShipMaterialTuning ): void {
    if ( mat.userData.baseRoughness === undefined ) mat.userData.baseRoughness = mat.roughness;
    const scaled = ( mat.userData.baseRoughness as number ) * t.hullRoughness;
    mat.roughness = scaled < 0.02 ? 0.02 : scaled > 1 ? 1 : scaled;
    mat.envMapIntensity = t.hullEnvMap;
}
