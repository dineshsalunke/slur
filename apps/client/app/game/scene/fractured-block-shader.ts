import * as THREE from 'three';
import { accentDerived } from './accent';
import { TEX_SPAN_X } from './track-texture';

export const FRACTURE_CORE_HEX = '#FFE0A0';
export const FRACTURE_ROUGHNESS = 0.8;
export const FRACTURE_DARKEN = 0.35;

export interface FracturedBlockUniforms {
    uFractureColor: { value: THREE.Color };
    uFractureCore: { value: THREE.Color };
    uFractureIntensity: { value: number };
    uFractureCoreDepth: { value: number };
    uFractureRoughness: { value: number };
    uFractureDarken: { value: number };
    uFractureTexSpan: { value: number };
    uFractureGap: { value: number };
}

const GLOW_BASE = accentDerived( ( base, out ) => {
    out.copy( base );
} );

export function fracturedBlockUniforms(): FracturedBlockUniforms {
    return {
        uFractureColor: { value: GLOW_BASE },
        uFractureCore: { value: new THREE.Color( FRACTURE_CORE_HEX ) },
        uFractureIntensity: { value: 1 },
        uFractureCoreDepth: { value: 1 },
        uFractureRoughness: { value: FRACTURE_ROUGHNESS },
        uFractureDarken: { value: FRACTURE_DARKEN },
        uFractureTexSpan: { value: TEX_SPAN_X },
        uFractureGap: { value: 0 },
    };
}

const VERT_HEAD = `
attribute float aFracture;
attribute vec3 aCellCentre;
attribute vec3 aCellHalf;
attribute vec4 aBlock;
attribute float aFractureGlow;
uniform float uFractureTexSpan;
uniform float uFractureGap;
varying float vFractureFace;
varying float vFractureGlow;
varying float vFractureDepth;

vec3 fractureTurn( vec3 v, float o ) {
	if ( o >= 4.0 ) v = vec3( v.x, -v.y, -v.z );
	float q = mod( o, 4.0 );
	if ( q >= 2.0 ) { v = vec3( -v.x, v.y, -v.z ); q -= 2.0; }
	if ( q >= 1.0 ) v = vec3( v.z, v.y, -v.x );
	return v;
}
`;

const NORMAL_BODY = `
vec3 fractureSize = aBlock.xyz;
vec3 fractureTex = fractureTurn( position, aBlock.w ) * fractureSize;
vec3 fractureCentre = fractureTurn( aCellCentre, aBlock.w ) * fractureSize;
vec3 fractureHalf = abs( fractureTurn( aCellHalf, aBlock.w ) ) * fractureSize;
vec3 fractureShrink = max( vec3( 0.0 ), 1.0 - uFractureGap / max( fractureHalf, vec3( 1e-3 ) ) );
vec3 fractureArm = ( fractureTex - fractureCentre ) * fractureShrink;
vec3 fractureNormal = normalize( fractureTurn( objectNormal, aBlock.w ) / fractureSize );
vec3 fractureHalfSize = 0.5 * fractureSize - abs( fractureTex );
vFractureDepth = min( fractureHalfSize.x, min( fractureHalfSize.y, fractureHalfSize.z ) );
vFractureFace = aFracture;
vFractureGlow = aFractureGlow;
#ifdef FRACTURE_DEBRIS
fractureCentre = vec3( 0.0 );
#endif
objectNormal = fractureNormal;
`;

const POSITION_BODY = `
transformed = fractureCentre + fractureArm;
vec3 fractureAxisPick = abs( fractureTurn( normal, aBlock.w ) );
vec2 fractureUv = fractureAxisPick.y > max( fractureAxisPick.x, fractureAxisPick.z )
	? fractureTex.xz
	: ( fractureAxisPick.x > fractureAxisPick.z ? fractureTex.zy : fractureTex.xy );
fractureUv /= max( uFractureTexSpan, 1e-3 );
vMapUv = fractureUv;
vNormalMapUv = fractureUv;
vRoughnessMapUv = fractureUv;
vMetalnessMapUv = fractureUv;
`;

const FRAG_HEAD = `
varying float vFractureFace;
varying float vFractureGlow;
varying float vFractureDepth;
uniform vec3 uFractureColor;
uniform vec3 uFractureCore;
uniform float uFractureIntensity;
uniform float uFractureCoreDepth;
uniform float uFractureRoughness;
uniform float uFractureDarken;
`;

const EMISSIVE_BODY = `
vec3 fractureHot = mix( uFractureColor, uFractureCore, smoothstep( 0.0, uFractureCoreDepth, vFractureDepth ) );
totalEmissiveRadiance += fractureHot * uFractureIntensity * vFractureGlow * vFractureFace;
`;

export function patchFracturedBlock( mat: THREE.Material, u: FracturedBlockUniforms, debris: boolean ): void {
    if ( mat.userData.fracturePatched ) return;
    mat.userData.fracturePatched = true;
    if ( debris ) mat.defines = { ...mat.defines, FRACTURE_DEBRIS: '' };
    mat.onBeforeCompile = ( shader ) => {
        Object.assign( shader.uniforms, u );
        shader.vertexShader = ( VERT_HEAD + shader.vertexShader )
            .replace( '#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${ NORMAL_BODY }` )
            .replace( '#include <begin_vertex>', `#include <begin_vertex>\n${ POSITION_BODY }` );
        shader.fragmentShader = ( FRAG_HEAD + shader.fragmentShader )
            .replace(
                '#include <map_fragment>',
                '#include <map_fragment>\ndiffuseColor.rgb *= mix( 1.0, uFractureDarken, vFractureFace );',
            )
            .replace(
                '#include <roughnessmap_fragment>',
                '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, uFractureRoughness, vFractureFace );',
            )
            .replace( '#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${ EMISSIVE_BODY }` );
    };
    mat.needsUpdate = true;
}
