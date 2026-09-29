import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { accent } from '../accent';
import { DECK_HASH_GLSL, DECK_TILE_GLSL } from '../deck-breakup';
import { TEX_SPAN_X, TEX_SPAN_Z } from '../track-texture';

export interface ReflectionUniforms {
    uReflColor: { value: THREE.Color };
    uReflStrength: { value: number };
    uReflStretch: { value: number };
    uReflLength: { value: number };
    uReflWidth: { value: number };
    uReflFalloff: { value: number };
    uReflFadeNear: { value: number };
    uReflFadeFar: { value: number };
    uReflGrazing: { value: number };
    uReflRoughMix: { value: number };
    uReflRoughness: { value: number };
    uReflClean: { value: number };
    uReflBlur: { value: number };
    uReflRoughMap: { value: THREE.Texture | null };
    uReflWorldPerUv: { value: THREE.Vector2 };
}

export interface StreakUniforms extends ReflectionUniforms {
    uReflGain: { value: number };
}

export function reflectionUniforms(): ReflectionUniforms {
    return {
        uReflColor: { value: accent() },
        uReflStrength: { value: 1 },
        uReflStretch: { value: 1.5 },
        uReflLength: { value: 36 },
        uReflWidth: { value: 0.6 },
        uReflFalloff: { value: 1.5 },
        uReflFadeNear: { value: 40 },
        uReflFadeFar: { value: 220 },
        uReflGrazing: { value: 2 },
        uReflRoughMix: { value: 0.8 },
        uReflRoughness: { value: 1 },
        uReflClean: { value: 0.5 },
        uReflBlur: { value: 0.01 },
        uReflRoughMap: { value: null },
        uReflWorldPerUv: { value: new THREE.Vector2( TEX_SPAN_X, TEX_SPAN_Z ) },
    };
}

export function updateReflection( u: ReflectionUniforms, deck: THREE.MeshStandardMaterial ): void {
    u.uReflStrength.value = num( 'Reflect.strength' );
    u.uReflStretch.value = num( 'Reflect.stretch' );
    u.uReflLength.value = num( 'Reflect.length' );
    u.uReflWidth.value = num( 'Reflect.width' );
    u.uReflFalloff.value = num( 'Reflect.falloff' );
    u.uReflFadeNear.value = num( 'Reflect.fadeNear' );
    u.uReflFadeFar.value = Math.max( num( 'Reflect.fadeFar' ), num( 'Reflect.fadeNear' ) + 1 );
    u.uReflGrazing.value = num( 'Reflect.grazing' );
    u.uReflRoughMix.value = num( 'Reflect.roughMix' );
    u.uReflRoughness.value = deck.roughness;
    u.uReflClean.value = num( 'Deck.roughness' );
    u.uReflRoughMap.value = deck.roughnessMap;
    const repeat = Math.max( deck.map?.repeat.x ?? 1, 1e-3 );
    u.uReflWorldPerUv.value.set( TEX_SPAN_X / repeat, TEX_SPAN_Z / repeat );
}

const STREAK_VERTEX_HEAD = /* glsl */ `
uniform float uReflStretch;
uniform float uReflLength;
uniform float uReflWidth;
uniform float uReflClean;
uniform float uReflBlur;
varying vec2 vReflQuad;
varying vec3 vReflWorld;
varying float vReflPower;
varying float vReflPoint;
varying float vReflCenter;
varying float vReflSoft;
struct ReflEmitter {
	vec3 base;
	float h0;
	float h1;
	float power;
	float point;
	float core;
	float reach;
};
vec2 reflDir( vec3 base ) {
	vec2 toCam = cameraPosition.xz - base.xz;
	return toCam / max( length( toCam ), 1e-3 );
}
float reflBoxReach( vec4 box, vec3 base ) {
	vec2 dir = reflDir( base );
	vec2 exit = mix( base.xz - box.xz, box.yw - base.xz, step( 0.0, dir ) ) / max( abs( dir ), vec2( 1e-4 ) );
	return min( exit.x, exit.y );
}
float reflFaceReach( vec2 normal, float free, vec3 base ) {
	return free / max( dot( reflDir( base ), normal ), 1e-3 );
}
`;

const STREAK_VERTEX_BODY = /* glsl */ `
void main() {
	ReflEmitter e;
	if ( ! reflEmitter( e ) || e.power <= 0.0 ) {
		gl_Position = vec4( 0.0, 0.0, 2.0, 1.0 );
		return;
	}
	vec3 base = e.base;
	float point = e.point;
	vec2 toCam = cameraPosition.xz - base.xz;
	float d = max( length( toCam ), 1e-3 );
	vec2 dir = toCam / d;
	vec2 side = vec2( dir.y, - dir.x );
	float eye = max( cameraPosition.y - base.y, 0.05 );
	float s0 = d * e.h0 / ( eye + e.h0 );
	float s1 = d * e.h1 / ( eye + e.h1 );
	float w = uReflWidth * ( 0.5 + uReflClean );
	float spread = clamp( s0 * 0.6 * uReflStretch, w, 0.5 * uReflLength );
	float start = mix( - 0.5 * w, s0 - spread, point );
	float end = min( min( mix( min( s1 * uReflStretch, uReflLength ), s0 + spread, point ), d - 0.3 ), e.reach );
	if ( end <= start ) {
		gl_Position = vec4( 0.0, 0.0, 2.0, 1.0 );
		return;
	}
	float along = mix( start, end, position.y );
	float sigma0 = max( 0.5 * e.core, 1e-3 );
	float sigma = sigma0 + uReflBlur * ( 0.5 + uReflClean ) * max( along, 0.0 );
	float width = mix( 6.0 * sigma, w, point );
	vec3 world = vec3( base.x, base.y + 0.015, base.z )
		+ vec3( dir.x, 0.0, dir.y ) * along
		+ vec3( side.x, 0.0, side.y ) * ( 0.5 * width * position.x );
	vReflQuad = position.xy;
	vReflWorld = world;
	vReflPower = e.power;
	vReflPoint = point;
	vReflCenter = ( s0 - start ) / ( end - start );
	vReflSoft = mix( sqrt( sigma0 / sigma ), 1.0, point );
	gl_Position = projectionMatrix * viewMatrix * vec4( world, 1.0 );
}
`;

const STREAK_FRAGMENT = /* glsl */ `
uniform vec3 uReflColor;
uniform float uReflStrength;
uniform float uReflGain;
uniform float uReflFalloff;
uniform float uReflFadeNear;
uniform float uReflFadeFar;
uniform float uReflGrazing;
uniform float uReflRoughMix;
uniform float uReflRoughness;
uniform float uReflClean;
uniform sampler2D uReflRoughMap;
uniform vec2 uReflWorldPerUv;
varying vec2 vReflQuad;
varying vec3 vReflWorld;
varying float vReflPower;
varying float vReflPoint;
varying float vReflCenter;
varying float vReflSoft;
${ DECK_HASH_GLSL }
${ DECK_TILE_GLSL }
void main() {
	float qx = clamp( vReflQuad.x, - 1.0, 1.0 );
	float across = 1.0 - qx * qx;
	float v = clamp( vReflQuad.y, 0.0, 1.0 );
	float line = pow( 1.0 - v, uReflFalloff ) * smoothstep( 0.0, 0.08, v );
	float k = ( v - vReflCenter ) * 3.5;
	float spot = exp( - k * k );
	float gx = 3.0 * qx;
	float soft = exp( - 0.5 * gx * gx ) * vReflSoft;
	float profile = mix( line * soft, spot * across * across, vReflPoint );
	vec3 toCam = cameraPosition - vReflWorld;
	float dist = length( toCam );
	float graze = pow( clamp( 1.0 - toCam.y / dist, 0.0, 1.0 ), uReflGrazing );
	float fade = 1.0 - smoothstep( uReflFadeNear, uReflFadeFar, dist );
	vec2 mapUv = vReflWorld.xz / uReflWorldPerUv;
	vec2 flip;
	vec2 tileUv = deckTileUv( mapUv, flip );
	float rough = textureGrad( uReflRoughMap, tileUv, dFdx( mapUv ), dFdy( mapUv ) ).g * uReflRoughness;
	float gloss = clamp( ( 1.0 - rough ) / max( 1.0 - uReflClean, 0.05 ), 0.0, 2.0 );
	float plate = mix( 1.0, gloss, uReflRoughMix );
	float glow = max( uReflStrength * uReflGain * vReflPower * profile * graze * fade * plate, 0.0 );
	gl_FragColor = vec4( uReflColor * glow, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export function streakMaterial(
    shared: ReflectionUniforms,
    emitter: string,
    extra: Record< string, THREE.IUniform > = {},
): THREE.ShaderMaterial {
    const uniforms: StreakUniforms & Record< string, THREE.IUniform > = {
        ...shared,
        ...extra,
        uReflGain: { value: 0 },
    };
    return new THREE.ShaderMaterial( {
        uniforms,
        vertexShader: STREAK_VERTEX_HEAD + emitter + STREAK_VERTEX_BODY,
        fragmentShader: STREAK_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        fog: false,
    } );
}

export function streakQuads( slots: number ): THREE.BufferGeometry {
    const pos: number[] = [];
    const slot: number[] = [];
    const index: number[] = [];
    for ( let s = 0; s < slots; s++ ) {
        const at = s * 4;
        pos.push( -1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0 );
        slot.push( s, s, s, s );
        index.push( at, at + 2, at + 1, at, at + 3, at + 2 );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute( 'position', new THREE.Float32BufferAttribute( pos, 3 ) );
    geo.setAttribute( 'aSlot', new THREE.Float32BufferAttribute( slot, 1 ) );
    geo.setIndex( index );
    return geo;
}
