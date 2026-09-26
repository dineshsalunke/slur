import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { accent } from './accent';

export const SHIELD_RING_R = 1.05;
const SHIELD_RING_TUBE = 0.2;
const SHIELD_HOOP_R = 0.72;
const SHIELD_GLYPH_TUBE = 0.06;
const SHIELD_CORE_R = 0.34;

export const SHIELD_DOME_MARGIN = 0.9;
export const SHIELD_DOME_HEIGHT = 1.7;
export const SHIELD_DOME_SINK = 0.35;
export const SHIELD_DOME_INTENSITY = 3.2;
export const SHIELD_HEX_COLUMNS = 18;
export const SHIELD_HEX_ROWS = 6;
export const SHIELD_FADE_S = 1;
export const SHIELD_FLICKER_HZ = 9;
export const SHIELD_POP_S = 0.28;
export const SHIELD_POP_GROW = 0.6;

const DOME_THETA = Math.PI * 0.56;

export function shieldPickupShellGeometry(): THREE.BufferGeometry {
    return new THREE.TorusGeometry( SHIELD_RING_R, SHIELD_RING_TUBE, 10, 48 );
}

export function shieldPickupGlyphGeometry(): THREE.BufferGeometry {
    const rim = new THREE.TorusGeometry( SHIELD_RING_R + SHIELD_RING_TUBE + 0.04, SHIELD_GLYPH_TUBE, 6, 48 );
    const hoop = new THREE.TorusGeometry( SHIELD_HOOP_R, SHIELD_GLYPH_TUBE, 6, 40 );
    const merged = mergeGeometries( [ rim, hoop ] );
    rim.dispose();
    hoop.dispose();
    return merged;
}

export function shieldPickupCoreGeometry(): THREE.BufferGeometry {
    return new THREE.SphereGeometry( SHIELD_CORE_R, 16, 12 );
}

export function shieldDomeGeometry(): THREE.BufferGeometry {
    return new THREE.SphereGeometry( 1, 48, 24, 0, Math.PI * 2, 0, DOME_THETA );
}

const DOME_VERTEX = `
varying vec2 vUv;
varying vec3 vNormalV;
varying vec3 vViewV;
varying float vLocalY;

void main() {
    vUv = uv;
    vLocalY = position.y;
    vec4 mv = modelViewMatrix * vec4( position, 1.0 );
    vNormalV = normalize( normalMatrix * normal );
    vViewV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
}
`;

const DOME_FRAGMENT = `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uAlpha;
uniform vec2 uCells;
varying vec2 vUv;
varying vec3 vNormalV;
varying vec3 vViewV;
varying float vLocalY;

const vec2 HEX = vec2( 1.0, 1.7320508 );

vec2 hexLocal( vec2 p ) {
    vec4 c = floor( vec4( p, p - vec2( 0.5, 1.0 ) ) / HEX.xyxy ) + 0.5;
    vec2 a = p - c.xy * HEX;
    vec2 b = p - ( c.zw + 0.5 ) * HEX;
    return dot( a, a ) < dot( b, b ) ? a : b;
}

float hexDist( vec2 p ) {
    p = abs( p );
    return max( dot( p, HEX * 0.5 ), p.x );
}

void main() {
    vec2 cell = hexLocal( vUv * uCells * HEX );
    float edge = 0.5 - hexDist( cell );
    float line = 1.0 - smoothstep( 0.03, 0.09, edge );
    float facing = abs( dot( normalize( vNormalV ), normalize( vViewV ) ) );
    float fres = pow( clamp( 1.0 - facing, 0.0, 1.0 ), 2.5 );
    float base = smoothstep( 0.0, 0.25, vLocalY );
    float glow = ( line * 0.85 + fres * 1.3 + 0.06 ) * base * uAlpha;
    gl_FragColor = vec4( uColor * glow * uIntensity, 1.0 );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export interface ShieldDomeUniforms {
    [ name: string ]: THREE.IUniform;
    uColor: THREE.IUniform< THREE.Color >;
    uIntensity: THREE.IUniform< number >;
    uAlpha: THREE.IUniform< number >;
    uCells: THREE.IUniform< THREE.Vector2 >;
}

export function shieldDomeUniforms(): ShieldDomeUniforms {
    return {
        uColor: { value: accent() },
        uIntensity: { value: SHIELD_DOME_INTENSITY },
        uAlpha: { value: 0 },
        uCells: { value: new THREE.Vector2( SHIELD_HEX_COLUMNS, SHIELD_HEX_ROWS ) },
    };
}

export const SHIELD_DOME_SHADER = { vertexShader: DOME_VERTEX, fragmentShader: DOME_FRAGMENT };

export function shieldAlpha( on: boolean, heldS: number, windowS: number, popAgeS: number ): number {
    if ( popAgeS >= 0 ) {
        const f = 1 - popAgeS / SHIELD_POP_S;
        return f > 0 ? 2.5 * f * f : 0;
    }
    if ( ! on ) return 0;
    const left = windowS - heldS;
    if ( left > SHIELD_FADE_S ) return 1;
    return Math.floor( heldS * SHIELD_FLICKER_HZ * 2 ) % 2 === 0 ? 0.9 : 0.25;
}

export function shieldGrow( popAgeS: number ): number {
    if ( popAgeS < 0 ) return 1;
    if ( popAgeS >= SHIELD_POP_S ) return 1 + SHIELD_POP_GROW;
    return 1 + SHIELD_POP_GROW * ( popAgeS / SHIELD_POP_S );
}
