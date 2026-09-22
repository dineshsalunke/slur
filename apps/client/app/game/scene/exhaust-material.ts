import * as THREE from 'three';
import { accent } from './accent';

const VERTEX = `
attribute float aAxial;
attribute vec3 aDrive;
varying float vAxial;
varying float vGlow;
varying vec3 vNormalView;
varying vec3 vViewDir;

void main() {
    vAxial = aAxial;
    vGlow = aDrive.z;
    vec3 shaped = vec3( position.xy * aDrive.y, position.z * aDrive.x );
    vec4 viewPos = modelViewMatrix * instanceMatrix * vec4( shaped, 1.0 );
    vViewDir = -viewPos.xyz;
    vec3 slant = normalize( vec3( normal.xy / aDrive.y, normal.z / aDrive.x ) );
    vNormalView = mat3( modelViewMatrix ) * mat3( instanceMatrix ) * slant;
    gl_Position = projectionMatrix * viewPos;
}
`;

const FRAGMENT = `
uniform vec3 uHot;
uniform vec3 uCool;
uniform float uSoftness;
uniform float uFalloff;
varying float vAxial;
varying float vGlow;
varying vec3 vNormalView;
varying vec3 vViewDir;

void main() {
    float facing = abs( dot( normalize( vNormalView ), normalize( vViewDir ) ) );
    float body = pow( facing, uSoftness ) * pow( 1.0 - vAxial, uFalloff );
    gl_FragColor = vec4( mix( uHot, uCool, vAxial ) * body * vGlow, 1.0 );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export function buildExhaustMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial( {
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
            uHot: { value: new THREE.Color( '#fff1dc' ) },
            uCool: { value: accent().clone() },
            uSoftness: { value: 2.2 },
            uFalloff: { value: 1.6 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
    } );
}
