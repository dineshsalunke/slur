import { HALF_WIDTH } from '@slur/shared';
import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { chainShaderPatch } from '../shader-patch';
import type { ReflectionUniforms } from './deck-reflection';

export interface RailSheenUniforms extends ReflectionUniforms {
    uReflRail: { value: number };
    uReflRailSpread: { value: number };
}

const VERT_HEAD = /* glsl */ `
varying vec3 vRailWorld;
`;

const VERT_BODY = /* glsl */ `
#include <project_vertex>
vRailWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
`;

const FRAG_HEAD = /* glsl */ `
varying vec3 vRailWorld;
uniform vec3 uReflColor;
uniform float uReflStrength;
uniform float uReflWidth;
uniform float uReflFadeNear;
uniform float uReflFadeFar;
uniform float uReflGrazing;
uniform float uReflRoughMix;
uniform float uReflClean;
uniform float uReflRail;
uniform float uReflRailSpread;
`;

const FRAG_BODY = /* glsl */ `
#include <emissivemap_fragment>
{
	float railEdge = max( ${ HALF_WIDTH.toFixed( 4 ) } - abs( vRailWorld.x ), 0.0 );
	vec3 railToCam = cameraPosition - vRailWorld;
	float railDist = length( railToCam );
	float railRough = clamp( roughnessFactor, 0.02, 1.0 );
	float railWidth = max( uReflWidth * uReflRailSpread * ( 0.5 + railRough ), 1e-3 );
	float railBand = exp( - railEdge / railWidth );
	float railGraze = pow( clamp( 1.0 - railToCam.y / railDist, 0.0, 1.0 ), uReflGrazing );
	float railFade = 1.0 - smoothstep( uReflFadeNear, uReflFadeFar, railDist );
	float railGloss = mix( 1.0, clamp( ( 1.0 - railRough ) / max( 1.0 - uReflClean, 0.05 ), 0.0, 2.0 ), uReflRoughMix );
	totalEmissiveRadiance += uReflColor * ( uReflStrength * uReflRail * railBand * railGraze * railFade * railGloss );
}
`;

export function updateRailSheen( u: RailSheenUniforms ): void {
    u.uReflRail.value = num( 'Reflect.rail' ) * num( 'Rail.railEmissive' );
    u.uReflRailSpread.value = num( 'Reflect.railSpread' );
}

function swap( src: string, from: string, to: string ): string {
    if ( ! src.includes( from ) ) throw new Error( `rail-sheen: shader has no ${ from }` );
    return src.replace( from, to );
}

export function railSheenVertex( vertexShader: string ): string {
    return VERT_HEAD + swap( vertexShader, '#include <project_vertex>', VERT_BODY );
}

export function railSheenFragment( fragmentShader: string ): string {
    return FRAG_HEAD + swap( fragmentShader, '#include <emissivemap_fragment>', FRAG_BODY );
}

export function patchRailSheen( material: THREE.MeshStandardMaterial, uniforms: RailSheenUniforms ): void {
    const key = material.customProgramCacheKey();
    const patched = chainShaderPatch( material, 'rail-sheen', ( shader ) => {
        Object.assign( shader.uniforms, uniforms );
        shader.vertexShader = railSheenVertex( shader.vertexShader );
        shader.fragmentShader = railSheenFragment( shader.fragmentShader );
    } );
    if ( patched ) material.customProgramCacheKey = () => `${ key }-rail-sheen`;
}
