import * as THREE from 'three';
import { buildBoltCoreMaterial, buildBoltSheathMaterial } from '../bolt-streak-material';
import { boltStreakGeometry } from '../combat-look';

export function buildLook() {
    return {
        streakGeo: boltStreakGeometry(),
        core: buildBoltCoreMaterial(),
        sheath: buildBoltSheathMaterial(),
        emberGeo: new THREE.OctahedronGeometry( 1, 0 ),
        ember: new THREE.MeshBasicMaterial( {
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        } ),
    };
}
