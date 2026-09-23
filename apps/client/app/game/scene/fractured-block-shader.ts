import type * as THREE from 'three';
import { accentDerived } from './accent';
import { SEALED_BLOCK_TEXTURE_SPAN } from './sealed-block-texture';

export const FRACTURE_GLOW_INTENSITY = 3.5;
export const FRACTURE_ROUGHNESS = 0.75;
export const FRACTURE_DARKEN = 0.35;

export interface FracturedBlockUniforms {
    uFractureColor: { value: THREE.Color };
    uFractureIntensity: { value: number };
    uFractureRoughness: { value: number };
    uFractureDarken: { value: number };
    uFractureTexSpan: { value: number };
}

const GLOW_BASE = accentDerived( ( base, out ) => {
    out.copy( base );
} );

export function fracturedBlockUniforms(): FracturedBlockUniforms {
    return {
        uFractureColor: { value: GLOW_BASE },
        uFractureIntensity: { value: FRACTURE_GLOW_INTENSITY },
        uFractureRoughness: { value: FRACTURE_ROUGHNESS },
        uFractureDarken: { value: FRACTURE_DARKEN },
        uFractureTexSpan: { value: SEALED_BLOCK_TEXTURE_SPAN },
    };
}

const VERT_HEAD = `
attribute float aFracture;
attribute float aFractureGlow;
uniform float uFractureTexSpan;
varying float vFractureFace;
varying float vFractureGlow;
`;

const VERT_BODY = `
vec3 fractureScale = vec3(
	length( instanceMatrix[ 0 ].xyz ),
	length( instanceMatrix[ 1 ].xyz ),
	length( instanceMatrix[ 2 ].xyz ) );
vec3 fractureLocal = transformed * fractureScale;
vec3 fractureAxis = abs( objectNormal );
vec2 fractureUv = fractureAxis.y > max( fractureAxis.x, fractureAxis.z )
	? fractureLocal.xz
	: ( fractureAxis.x > fractureAxis.z ? fractureLocal.zy : fractureLocal.xy );
fractureUv /= max( uFractureTexSpan, 1e-3 );
vMapUv = fractureUv;
vNormalMapUv = fractureUv;
vRoughnessMapUv = fractureUv;
vMetalnessMapUv = fractureUv;
vFractureFace = step( 0.01, aFracture );
vFractureGlow = aFracture * aFractureGlow;
`;

const FRAG_HEAD = `
varying float vFractureFace;
varying float vFractureGlow;
uniform vec3 uFractureColor;
uniform float uFractureIntensity;
uniform float uFractureRoughness;
uniform float uFractureDarken;
`;

export function patchFracturedBlock( mat: THREE.Material, u: FracturedBlockUniforms ): void {
    if ( mat.userData.fracturePatched ) return;
    mat.userData.fracturePatched = true;
    mat.onBeforeCompile = ( shader ) => {
        Object.assign( shader.uniforms, u );
        shader.vertexShader = ( VERT_HEAD + shader.vertexShader ).replace(
            '#include <project_vertex>',
            `${ VERT_BODY }\n#include <project_vertex>`,
        );
        shader.fragmentShader = ( FRAG_HEAD + shader.fragmentShader )
            .replace(
                '#include <map_fragment>',
                '#include <map_fragment>\ndiffuseColor.rgb *= mix( 1.0, uFractureDarken, vFractureFace );',
            )
            .replace(
                '#include <roughnessmap_fragment>',
                '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, uFractureRoughness, vFractureFace );',
            )
            .replace(
                '#include <emissivemap_fragment>',
                '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uFractureColor * uFractureIntensity * vFractureGlow;',
            );
    };
    mat.needsUpdate = true;
}
