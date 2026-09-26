import * as THREE from 'three';
import { accent } from './accent';
import { BOOST_STREAK_INTENSITY } from './boost-look';
import { BOLT_HOT } from './combat-look';

const VERTEX = `
attribute float aLevel;
varying vec2 vUv;
varying float vLevel;

void main() {
    vUv = uv;
    vLevel = aLevel;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4( position, 1.0 );
}
`;

const FRAGMENT = `
uniform vec3 uHot;
uniform vec3 uCool;
uniform float uIntensity;
uniform float uFalloff;
uniform float uEdge;
varying vec2 vUv;
varying float vLevel;

void main() {
    float along = clamp( vUv.y, 0.0, 1.0 );
    float lead = 1.0 - along;
    float across = abs( vUv.x * 2.0 - 1.0 );
    float edge = 1.0 - smoothstep( 1.0 - uEdge, 1.0, across );
    float core = 1.0 - smoothstep( 0.0, 0.45, across );
    float body = pow( lead, uFalloff ) * edge;
    vec3 tint = mix( uCool, uHot, core * smoothstep( 0.55, 1.0, lead ) );
    gl_FragColor = vec4( tint * body * vLevel * uIntensity, 1.0 );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export function buildBoostStreakMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial( {
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
            uHot: { value: new THREE.Color( BOLT_HOT ) },
            uCool: { value: accent() },
            uIntensity: { value: BOOST_STREAK_INTENSITY },
            uFalloff: { value: 2.2 },
            uEdge: { value: 0.7 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
    } );
}
