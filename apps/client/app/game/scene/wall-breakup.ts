import type * as THREE from 'three';
import { BLOTCH_WEAR_GLSL, type BlotchWearUniforms } from './deck-breakup';

const VERT_HEAD = /* glsl */ `
varying vec3 vWallWorld;
`;

const VERT_BODY = /* glsl */ `
vec4 wallWorld = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
wallWorld = instanceMatrix * wallWorld;
#endif
vWallWorld = ( modelMatrix * wallWorld ).xyz;
`;

const FRAG_HEAD = /* glsl */ `
varying vec3 vWallWorld;
${ BLOTCH_WEAR_GLSL }
vec2 wallPlane( vec3 p ) {
	vec3 a = abs( cross( dFdx( p ), dFdy( p ) ) );
	if ( a.x >= a.y && a.x >= a.z ) return p.zy;
	if ( a.y >= a.z ) return p.xz;
	return p.xy;
}
`;

const MAP = /* glsl */ `
float wallShade = blotchShade( deckBlotch( wallPlane( vWallWorld ) ) );
float wallWear = blotchWear( wallShade );
diffuseColor.rgb *= pow( wallShade, 2.2 );
`;

const ROUGHNESS = /* glsl */ `
roughnessFactor -= roughness * wallWear * uWearRoughSpan;
`;

const METALNESS = /* glsl */ `
metalnessFactor = clamp( metalnessFactor + metalness * wallWear * uWearMetalSlope, 0.0, metalness );
`;

function after( src: string, include: string, body: string ): string {
    const tag = `#include <${ include }>`;
    if ( ! src.includes( tag ) ) throw new Error( `wall-breakup: shader has no ${ tag }` );
    return src.replace( tag, `${ tag }\n${ body }` );
}

export function wallBreakupVertex( vertexShader: string ): string {
    return VERT_HEAD + after( vertexShader, 'project_vertex', VERT_BODY );
}

export function wallBreakupFragment( fragmentShader: string ): string {
    let out = after( fragmentShader, 'map_fragment', MAP );
    out = after( out, 'roughnessmap_fragment', ROUGHNESS );
    out = after( out, 'metalnessmap_fragment', METALNESS );
    return FRAG_HEAD + out;
}

const patched = new WeakSet< THREE.Material[ 'onBeforeCompile' ] >();

export function patchWallBreakup( material: THREE.Material, uniforms: BlotchWearUniforms ): void {
    const prior = material.onBeforeCompile;
    if ( patched.has( prior ) ) return;
    const key = material.customProgramCacheKey();
    material.onBeforeCompile = ( shader, renderer ) => {
        prior.call( material, shader, renderer );
        Object.assign( shader.uniforms, uniforms );
        shader.vertexShader = wallBreakupVertex( shader.vertexShader );
        shader.fragmentShader = wallBreakupFragment( shader.fragmentShader );
    };
    patched.add( material.onBeforeCompile );
    material.customProgramCacheKey = () => `${ key }-wall-breakup`;
}
