import * as THREE from 'three';
import { num } from '../../dev/tuning';
import {
    BLOTCH_BRIGHT_BAND,
    BLOTCH_CELLS_U,
    BLOTCH_DARK_BAND,
    BLOTCH_OCTAVES,
    COLS,
    ROWS,
    TEX_SPAN_X,
    TEX_SPAN_Z,
} from './track-texture';

export interface BlotchWearUniforms {
    uBlotchDark: { value: number };
    uBlotchBright: { value: number };
    uWearValueSpan: { value: number };
    uWearRoughSpan: { value: number };
    uWearMetalSlope: { value: number };
}

export interface DeckBreakupUniforms extends BlotchWearUniforms {
    uDeckWorldPerUv: { value: THREE.Vector2 };
}

export function blotchWearUniforms(): BlotchWearUniforms {
    return {
        uBlotchDark: { value: 0 },
        uBlotchBright: { value: 0 },
        uWearValueSpan: { value: 1 },
        uWearRoughSpan: { value: 0 },
        uWearMetalSlope: { value: 0 },
    };
}

export function deckBreakupUniforms(): DeckBreakupUniforms {
    return { ...blotchWearUniforms(), uDeckWorldPerUv: { value: new THREE.Vector2( TEX_SPAN_X, TEX_SPAN_Z ) } };
}

export function updateBlotchWear( uniforms: BlotchWearUniforms ): void {
    uniforms.uBlotchDark.value = num( 'Blotch.dark' );
    uniforms.uBlotchBright.value = num( 'Blotch.bright' );
    uniforms.uWearValueSpan.value = Math.max( 1e-3, num( 'Wear.valueSpan' ) );
    uniforms.uWearRoughSpan.value = num( 'Wear.roughSpan' );
    uniforms.uWearMetalSlope.value = ( num( 'Wear.metalMax' ) - num( 'Wear.metalMin' ) ) / 2;
}

export function updateDeckBreakup( uniforms: DeckBreakupUniforms, map: THREE.Texture ): void {
    const repeat = Math.max( map.repeat.x, 1e-3 );
    uniforms.uDeckWorldPerUv.value.set( TEX_SPAN_X / repeat, TEX_SPAN_Z / repeat );
    updateBlotchWear( uniforms );
}

const f = ( n: number ) => n.toFixed( 5 );

export const BLOTCH_WEAR_GLSL = /* glsl */ `
uniform float uBlotchDark;
uniform float uBlotchBright;
uniform float uWearValueSpan;
uniform float uWearRoughSpan;
uniform float uWearMetalSlope;

float deckHash( vec2 c, float seed ) {
	uvec2 q = uvec2( ivec2( c ) + 1048576 );
	uint h = q.x * 73856093u ^ q.y * 19349663u ^ uint( seed ) * 83492791u;
	h = ( h ^ ( h >> 15u ) ) * 0x2c1b3c6du;
	h = ( h ^ ( h >> 12u ) ) * 0x297a2d39u;
	return float( h >> 8u ) / 16777216.0;
}

float deckNoise( vec2 p, float seed ) {
	vec2 i = floor( p );
	vec2 t = p - i;
	t = t * t * ( 3.0 - 2.0 * t );
	float a = deckHash( i, seed );
	float b = deckHash( i + vec2( 1.0, 0.0 ), seed );
	float c = deckHash( i + vec2( 0.0, 1.0 ), seed );
	float d = deckHash( i + vec2( 1.0, 1.0 ), seed );
	return mix( mix( a, b, t.x ), mix( c, d, t.x ), t.y );
}

float deckBlotch( vec2 world ) {
	vec2 p = world * ${ f( BLOTCH_CELLS_U ) };
	float n = 0.0;
	float amp = 0.5;
	float norm = 0.0;
	for ( int o = 0; o < ${ BLOTCH_OCTAVES }; o++ ) {
		n += amp * deckNoise( p, float( o ) );
		norm += amp;
		amp *= 0.5;
		p *= 2.0;
	}
	n /= norm;
	return smoothstep( ${ f( BLOTCH_DARK_BAND[ 0 ] ) }, ${ f( BLOTCH_DARK_BAND[ 1 ] ) }, n )
		- smoothstep( ${ f( BLOTCH_BRIGHT_BAND[ 0 ] ) }, ${ f( BLOTCH_BRIGHT_BAND[ 1 ] ) }, 1.0 - n );
}

float blotchShade( float b ) {
	return 1.0 - ( b > 0.0 ? uBlotchDark : uBlotchBright ) * b;
}

float blotchWear( float shade ) {
	return clamp( ( shade - 1.0 ) / uWearValueSpan, -1.0, 1.0 );
}
`;

const FRAG_HEAD = /* glsl */ `
uniform vec2 uDeckWorldPerUv;
${ BLOTCH_WEAR_GLSL }
vec2 deckTileUv( vec2 uv, out vec2 flip ) {
	vec2 plates = vec2( ${ f( COLS ) }, ${ f( ROWS ) } );
	vec2 g = uv * plates;
	vec2 cell = floor( g );
	vec2 local = g - cell;
	float pick = floor( deckHash( cell, 11.0 ) * plates.x );
	vec2 m = step( 0.5, vec2( deckHash( cell, 12.0 ), deckHash( cell, 13.0 ) ) );
	flip = 1.0 - 2.0 * m;
	local = mix( local, 1.0 - local, m );
	return ( vec2( pick, mod( cell.y, plates.y ) ) + local ) / plates;
}
`;

function swap( src: string, from: string, to: string ): string {
    if ( ! src.includes( from ) ) throw new Error( `deck-breakup: shader has no ${ from }` );
    return src.replaceAll( from, to );
}

const MAP = /* glsl */ `
vec2 deckFlip;
vec2 deckUv = deckTileUv( vMapUv, deckFlip );
vec2 deckDx = dFdx( vMapUv );
vec2 deckDy = dFdy( vMapUv );
float deckB = deckBlotch( vMapUv * uDeckWorldPerUv );
${ swap( THREE.ShaderChunk.map_fragment, 'texture2D( map, vMapUv )', 'textureGrad( map, deckUv, deckDx, deckDy )' ) }
float deckShade = blotchShade( deckB );
float deckWear = blotchWear( deckShade );
diffuseColor.rgb *= pow( deckShade, 2.2 );
`;

const ROUGHNESS = swap(
    swap(
        THREE.ShaderChunk.roughnessmap_fragment,
        'texture2D( roughnessMap, vRoughnessMapUv )',
        'textureGrad( roughnessMap, deckUv, deckDx, deckDy )',
    ),
    'roughnessFactor *= texelRoughness.g;',
    'roughnessFactor *= texelRoughness.g - deckWear * uWearRoughSpan;',
);

const METALNESS = swap(
    swap(
        THREE.ShaderChunk.metalnessmap_fragment,
        'texture2D( metalnessMap, vMetalnessMapUv )',
        'textureGrad( metalnessMap, deckUv, deckDx, deckDy )',
    ),
    'metalnessFactor *= texelMetalness.b;',
    'metalnessFactor *= clamp( texelMetalness.b + deckWear * uWearMetalSlope, 0.0, 1.0 );',
);

const NORMAL = swap(
    swap(
        THREE.ShaderChunk.normal_fragment_maps,
        'texture2D( normalMap, vNormalMapUv )',
        'textureGrad( normalMap, deckUv, deckDx, deckDy )',
    ),
    'mapN.xy *= normalScale;',
    'mapN.xy *= normalScale * deckFlip;',
);

export function deckBreakupFragment( fragmentShader: string ): string {
    let out = swap( fragmentShader, '#include <map_fragment>', MAP );
    out = swap( out, '#include <roughnessmap_fragment>', ROUGHNESS );
    out = swap( out, '#include <metalnessmap_fragment>', METALNESS );
    out = swap( out, '#include <normal_fragment_maps>', NORMAL );
    return FRAG_HEAD + out;
}

export function patchDeckBreakup( material: THREE.MeshStandardMaterial, uniforms: DeckBreakupUniforms ): void {
    const prior = material.onBeforeCompile;
    const key = material.customProgramCacheKey();
    material.onBeforeCompile = ( shader, renderer ) => {
        prior.call( material, shader, renderer );
        Object.assign( shader.uniforms, uniforms );
        shader.fragmentShader = deckBreakupFragment( shader.fragmentShader );
    };
    material.customProgramCacheKey = () => `${ key }-deck-breakup`;
}
