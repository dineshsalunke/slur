import * as THREE from 'three';
import { accentDerived } from './accent';
import { SEALED_BLOCK_TEXTURE_SPAN } from './sealed-block-texture';

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
    uBreakTime: { value: number };
    uBreakLife: { value: number };
    uBreakSpeed: { value: number };
    uBreakSide: { value: number };
    uBreakUp: { value: number };
    uBreakSpin: { value: number };
    uBreakGravity: { value: number };
    uBreakFlare: { value: number };
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
        uFractureTexSpan: { value: SEALED_BLOCK_TEXTURE_SPAN },
        uFractureGap: { value: 0 },
        uBreakTime: { value: 0 },
        uBreakLife: { value: 1 },
        uBreakSpeed: { value: 0 },
        uBreakSide: { value: 0 },
        uBreakUp: { value: 0 },
        uBreakSpin: { value: 0 },
        uBreakGravity: { value: 0 },
        uBreakFlare: { value: 1 },
    };
}

const VERT_HEAD = `
attribute float aFracture;
attribute vec3 aCellCentre;
attribute vec3 aCellHalf;
attribute float aCellSeed;
attribute vec4 aBlock;
uniform float uFractureTexSpan;
uniform float uFractureGap;
varying float vFractureFace;
varying float vFractureGlow;
varying float vFractureDepth;
#ifdef FRACTURE_DEBRIS
attribute vec4 aBreak;
attribute vec2 aBreakMeta;
uniform float uBreakTime;
uniform float uBreakLife;
uniform float uBreakSpeed;
uniform float uBreakSide;
uniform float uBreakUp;
uniform float uBreakSpin;
uniform float uBreakGravity;
uniform float uBreakFlare;
#else
attribute float aFractureGlow;
#endif

vec3 fractureTurn( vec3 v, float o ) {
	if ( o >= 4.0 ) v = vec3( v.x, -v.y, -v.z );
	float q = mod( o, 4.0 );
	if ( q >= 2.0 ) { v = vec3( -v.x, v.y, -v.z ); q -= 2.0; }
	if ( q >= 1.0 ) v = vec3( v.z, v.y, -v.x );
	return v;
}

float fractureHash( float n ) {
	return fract( sin( n * 12.9898 + 4.1414 ) * 43758.5453 );
}

mat3 fractureSpin( vec3 axis, float a ) {
	float s = sin( a );
	float c = cos( a );
	float t = 1.0 - c;
	return mat3(
		t * axis.x * axis.x + c, t * axis.x * axis.y + s * axis.z, t * axis.x * axis.z - s * axis.y,
		t * axis.x * axis.y - s * axis.z, t * axis.y * axis.y + c, t * axis.y * axis.z + s * axis.x,
		t * axis.x * axis.z + s * axis.y, t * axis.y * axis.z - s * axis.x, t * axis.z * axis.z + c );
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
#ifdef FRACTURE_DEBRIS
float fractureAge = max( 0.0, uBreakTime - aBreak.x );
float fractureLife = clamp( fractureAge / uBreakLife, 0.0, 1.0 );
float fractureKey = aCellSeed * 7.31 + aBreakMeta.y;
vec3 fractureAway = fractureCentre - aBreak.yzw;
vec3 fractureVel = normalize( fractureAway + vec3( 0.0, 0.25, 0.0 ) ) * uBreakSpeed * ( 0.7 + 0.6 * fractureHash( fractureKey ) );
fractureVel.x += sign( fractureAway.x + 1e-3 ) * uBreakSide * ( 0.6 + 0.8 * fractureHash( fractureKey + 1.0 ) );
fractureVel.y += uBreakUp * ( 0.5 + fractureHash( fractureKey + 2.0 ) );
fractureVel.z *= mix( 1.0, 0.35, aBreakMeta.x );
vec3 fractureAxis = normalize( vec3( fractureHash( fractureKey + 3.0 ), fractureHash( fractureKey + 4.0 ), fractureHash( fractureKey + 5.0 ) ) - 0.5 + 1e-3 );
mat3 fractureRot = fractureSpin( fractureAxis, uBreakSpin * fractureAge * ( 0.5 + fractureHash( fractureKey + 6.0 ) ) );
fractureArm = fractureRot * fractureArm * ( 1.0 - smoothstep( 0.45, 1.0, fractureLife ) );
fractureCentre += fractureVel * fractureAge - vec3( 0.0, 0.5 * uBreakGravity * fractureAge * fractureAge, 0.0 );
fractureNormal = fractureRot * fractureNormal;
vFractureGlow = uBreakFlare * ( 1.0 - smoothstep( 0.0, 0.6, fractureLife ) );
#else
vFractureGlow = aFractureGlow;
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
