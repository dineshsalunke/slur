import type * as THREE from 'three';
import { col, num } from '../../dev/tuning';

export function applyBlockMetal( material: THREE.MeshStandardMaterial ): void {
    const normalScale = num( 'Block.normalScale' );
    material.color.set( col( 'Metal.mapTint' ) );
    material.metalness = num( 'Block.metalness' );
    material.roughness = num( 'Block.roughness' );
    material.envMapIntensity = num( 'Block.envMapIntensity' );
    material.normalScale.set( normalScale, normalScale );
}
