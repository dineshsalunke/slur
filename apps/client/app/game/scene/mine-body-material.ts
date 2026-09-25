import type * as THREE from 'three';
import { graphiteShellMaterial } from './track-materials';

const HEAD = `#include <common>
attribute vec3 aHinge;
attribute float aOpen;`;

const FOLD = 'vec3 transformed = aHinge + ( position - aHinge ) * aOpen;';

export function mineBodyMaterial(): THREE.MeshStandardMaterial {
    const material = graphiteShellMaterial();
    material.onBeforeCompile = ( shader ) => {
        shader.vertexShader = shader.vertexShader
            .replace( '#include <common>', HEAD )
            .replace( '#include <begin_vertex>', FOLD );
    };
    material.customProgramCacheKey = () => 'slur-mine-body-fold';
    return material;
}
