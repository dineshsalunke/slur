import { HALF_WIDTH, LEAD_SEGMENTS, SEG_LEN } from '@slur/shared';
import type { RefObject } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { RAIL_W } from './track-geometry';
import type { RailRun } from './track-rails';

const RAIL_X = HALF_WIDTH + RAIL_W / 2;
const MASK_WIDTH = 1024;
const MASK_RAMP = 2;

const applied = new WeakMap< RailGlowUniforms, { color: string; intensity: number } >();

export interface RailGlowUniforms {
    uRailX: { value: number };
    uRailLift: { value: number };
    uRailColor: { value: THREE.Color };
    uRailMask: { value: THREE.DataTexture | null };
    uRailMaskCount: { value: number };
}

export interface RailMask {
    texture: RefObject< THREE.DataTexture | null >;
    count: number;
}

export interface RailMaskData {
    data: Float32Array;
    width: number;
    rows: number;
}

export function railGlowUniforms(): RailGlowUniforms {
    return {
        uRailX: { value: RAIL_X },
        uRailLift: { value: 0 },
        uRailColor: { value: new THREE.Color( 0, 0, 0 ) },
        uRailMask: { value: null },
        uRailMaskCount: { value: 0 },
    };
}

export function buildRailMask( runs: RailRun[], segments: number ): THREE.DataTexture {
    const { data, width, rows } = railMaskData( runs, segments );
    const texture = new THREE.DataTexture( data, width, rows, THREE.RGBAFormat, THREE.FloatType );
    texture.needsUpdate = true;
    return texture;
}

export function railMaskData( runs: RailRun[], segments: number ): RailMaskData {
    const count = segments + LEAD_SEGMENTS;
    const rows = Math.max( 1, Math.ceil( count / MASK_WIDTH ) );
    const data = new Float32Array( MASK_WIDTH * rows * 4 );
    for ( const run of runs ) {
        const channel = run.x < 0 ? 0 : 2;
        const first = Math.round( run.z0 / SEG_LEN ) + LEAD_SEGMENTS;
        const last = Math.round( run.z1 / SEG_LEN ) + LEAD_SEGMENTS;
        for ( let k = Math.max( first, 0 ); k < Math.min( last, count ); k++ ) {
            data[ k * 4 + channel ] = 1;
            data[ k * 4 + channel + 1 ] = run.y;
        }
    }
    return { data, width: MASK_WIDTH, rows };
}

export function updateRailGlow( u: RailGlowUniforms, mask: THREE.DataTexture | null, count: number ): void {
    u.uRailMask.value = mask;
    u.uRailMaskCount.value = count;
    u.uRailLift.value = num( 'RailLight.lift' );
    const color = col( 'RailLight.color' );
    const intensity = num( 'RailLight.intensity' );
    const last = applied.get( u );
    if ( last && last.color === color && last.intensity === intensity ) return;
    u.uRailColor.value.set( color ).multiplyScalar( intensity );
    if ( last ) {
        last.color = color;
        last.intensity = intensity;
    } else applied.set( u, { color, intensity } );
}

const FRAG_HEAD = `
uniform float uRailX;
uniform float uRailLift;
uniform vec3 uRailColor;
uniform sampler2D uRailMask;
uniform int uRailMaskCount;

vec4 railMaskAt( int k ) {
	if ( k < 0 || k >= uRailMaskCount ) return vec4( 0.0 );
	return texelFetch( uRailMask, ivec2( k % ${ MASK_WIDTH }, k / ${ MASK_WIDTH } ), 0 );
}

vec4 railMask( float worldZ ) {
	float t = worldZ / ${ SEG_LEN.toFixed( 1 ) } + ${ LEAD_SEGMENTS.toFixed( 1 ) };
	int k = int( floor( t ) );
	float ramp = smoothstep( 1.0 - ${ ( MASK_RAMP / SEG_LEN ).toFixed( 4 ) }, 1.0, fract( t ) );
	return mix( railMaskAt( k ), railMaskAt( k + 1 ), ramp );
}

vec3 railToWorld( vec3 p ) {
	return ( p - viewMatrix[ 3 ].xyz ) * mat3( viewMatrix );
}

void railGlowLine( float side, vec3 p, vec3 n, vec3 v, float roughness, vec3 diffuseColor, vec3 specularColor, inout vec3 diffuse, inout vec3 specular ) {
	vec3 pw = railToWorld( p );
	vec4 here = railMask( pw.z );
	vec2 run = side < 0.0 ? here.xy : here.zw;
	vec3 origin = ( viewMatrix * vec4( side * uRailX, run.y + uRailLift, pw.z, 1.0 ) ).xyz;
	vec3 dir = viewMatrix[ 2 ].xyz;

	vec3 toOrigin = origin - p;
	vec3 nearest = toOrigin - dir * dot( toOrigin, dir );
	float d = max( length( nearest ), 0.6 );
	vec3 l = nearest / d;
	float wrap = max( dot( n, l ) + 0.15, 0.0 ) / 1.15;
	diffuse += diffuseColor * uRailColor * wrap * run.x / d;

	vec3 r = reflect( - v, n );
	float rd = dot( r, dir );
	float denom = 1.0 - rd * rd;
	float t = ( dot( toOrigin, r ) - dot( toOrigin, dir ) * rd ) / max( denom, 1e-4 );
	float s = dot( toOrigin, dir ) - t * rd;
	vec3 q = origin - dir * s;
	vec4 there = railMask( railToWorld( q ).z );
	float present = side < 0.0 ? there.x : there.z;
	vec3 lq = q - p;
	float dq = max( length( lq ), 0.6 );
	lq /= dq;
	float miss = length( r * max( t, 0.0 ) - ( q - p ) );
	float width = 0.4 + roughness * roughness * 6.0;
	float streak = exp( - miss * miss / ( width * width ) ) * step( 0.0, t );
	specular += specularColor * uRailColor * streak * present * max( dot( n, lq ), 0.0 ) * ( 1.0 - roughness ) * 1.5 / dq;
}
`;

const FRAG_LIGHT = `
#include <lights_fragment_end>
{
	vec3 railDiffuse = vec3( 0.0 );
	vec3 railSpecular = vec3( 0.0 );
	railGlowLine( -1.0, geometryPosition, geometryNormal, geometryViewDir, material.roughness, BRDF_Lambert( material.diffuseColor ), material.specularColor, railDiffuse, railSpecular );
	railGlowLine( 1.0, geometryPosition, geometryNormal, geometryViewDir, material.roughness, BRDF_Lambert( material.diffuseColor ), material.specularColor, railDiffuse, railSpecular );
	reflectedLight.directDiffuse += railDiffuse;
	reflectedLight.directSpecular += railSpecular;
}
`;

export function patchRailGlow( material: THREE.MeshStandardMaterial, uniforms: RailGlowUniforms ): void {
    material.onBeforeCompile = ( shader ) => {
        Object.assign( shader.uniforms, uniforms );
        shader.fragmentShader =
            FRAG_HEAD + shader.fragmentShader.replace( '#include <lights_fragment_end>', FRAG_LIGHT );
    };
    material.customProgramCacheKey = () => 'slur-rail-glow';
}
