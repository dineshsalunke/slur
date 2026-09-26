import * as THREE from 'three';
import { accent } from './accent';
import { BOLT_HOT, PICKUP_CORE_INTENSITY, PICKUP_GLYPH_INTENSITY } from './combat-look';
import type { PickupPart } from './pickup-instances/pickup-instances';
import { graphiteShellMaterial } from './track-materials';

export function pickupBody(
    shell: THREE.BufferGeometry,
    glyph: THREE.BufferGeometry,
    core: THREE.BufferGeometry,
): PickupPart[] {
    const glyphMaterial = new THREE.MeshStandardMaterial( {
        color: '#000000',
        emissiveIntensity: PICKUP_GLYPH_INTENSITY,
    } );
    glyphMaterial.emissive = accent();
    return [
        { geometry: shell, material: graphiteShellMaterial() },
        { geometry: glyph, material: glyphMaterial },
        {
            geometry: core,
            material: new THREE.MeshStandardMaterial( {
                color: '#000000',
                emissive: BOLT_HOT,
                emissiveIntensity: PICKUP_CORE_INTENSITY,
            } ),
        },
    ];
}
