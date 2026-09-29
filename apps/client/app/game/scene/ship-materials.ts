import type * as THREE from 'three';

export const ENGINE_MATERIAL = 'Engine_core';
export const NOZZLE_FACE_MATERIAL = 'Marigold_emission';
export const NOZZLE_MATERIALS: readonly string[] = [ ENGINE_MATERIAL, NOZZLE_FACE_MATERIAL ];

export interface EngineGlow {
    idle: number;
    cruise: number;
}

export function engineIntensity( g: EngineGlow, speed: number ): number {
    const s = speed < 0 ? 0 : speed > 1 ? 1 : speed;
    return g.idle + ( g.cruise - g.idle ) * s;
}

export function engineMaterial( mat: THREE.Material ): THREE.MeshStandardMaterial | null {
    const std = mat as THREE.MeshStandardMaterial;
    return std.isMeshStandardMaterial && std.name === ENGINE_MATERIAL ? std : null;
}

export function nozzleMaterial( mat: THREE.Material ): THREE.MeshStandardMaterial | null {
    const std = mat as THREE.MeshStandardMaterial;
    return std.isMeshStandardMaterial && NOZZLE_MATERIALS.includes( std.name ) ? std : null;
}

export function tintNozzle( mat: THREE.MeshStandardMaterial, hue: THREE.Color ): void {
    mat.emissive.copy( hue );
    mat.color.setRGB( 0, 0, 0 );
}
