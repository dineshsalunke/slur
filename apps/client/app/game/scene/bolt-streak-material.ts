import * as THREE from 'three';
import { accent } from './accent';
import { BOLT_HOT, BOLT_SHEATH_GIRTH, BOLT_SHEATH_INTENSITY, BOLT_STREAK_INTENSITY } from './combat-look';

const VERTEX = `
attribute float aAxial;
uniform float uGirth;
varying float vAxial;
varying vec3 vNormalView;
varying vec3 vViewDir;

void main() {
    vAxial = aAxial;
    vec3 shaped = vec3( position.xy * uGirth, position.z );
    vec4 viewPos = modelViewMatrix * instanceMatrix * vec4( shaped, 1.0 );
    vViewDir = -viewPos.xyz;
    vNormalView = mat3( modelViewMatrix ) * mat3( instanceMatrix ) * normal;
    gl_Position = projectionMatrix * viewPos;
}
`;

const FRAGMENT = `
uniform vec3 uHot;
uniform vec3 uCool;
uniform float uIntensity;
uniform float uSoftness;
uniform float uFalloff;
uniform float uHeat;
varying float vAxial;
varying vec3 vNormalView;
varying vec3 vViewDir;

void main() {
    float facing = abs( dot( normalize( vNormalView ), normalize( vViewDir ) ) );
    float lead = clamp( 1.0 - vAxial, 0.0, 1.0 );
    float body = pow( facing, uSoftness ) * pow( lead, uFalloff );
    vec3 tint = mix( uCool, uHot, uHeat * smoothstep( 0.6, 1.0, lead ) );
    gl_FragColor = vec4( tint * body * uIntensity, 1.0 );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

function build( girth: number, intensity: number, softness: number, falloff: number, heat: number ) {
    return new THREE.ShaderMaterial( {
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
            uHot: { value: new THREE.Color( BOLT_HOT ) },
            uCool: { value: accent() },
            uGirth: { value: girth },
            uIntensity: { value: intensity },
            uSoftness: { value: softness },
            uFalloff: { value: falloff },
            uHeat: { value: heat },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    } );
}

export function buildBoltCoreMaterial(): THREE.ShaderMaterial {
    return build( 1, BOLT_STREAK_INTENSITY, 0.8, 1.2, 1 );
}

export function buildBoltSheathMaterial(): THREE.ShaderMaterial {
    return build( BOLT_SHEATH_GIRTH, BOLT_SHEATH_INTENSITY, 2.5, 2, 0 );
}
