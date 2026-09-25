import type * as THREE from 'three';

export const ENGINE_MATERIAL = 'Engine_core';

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
