import * as THREE from 'three';
import { accent } from './accent';
import { PICKUP_POOL_INTENSITY } from './combat-look';

const VERTEX = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4( position, 1.0 );
}
`;

const FRAGMENT = `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;

void main() {
    float r = length( vUv - 0.5 ) * 2.0;
    float fall = pow( clamp( 1.0 - r, 0.0, 1.0 ), 2.2 );
    gl_FragColor = vec4( uColor * fall * uIntensity, 1.0 );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export function buildPickupPoolMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial( {
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
            uColor: { value: accent() },
            uIntensity: { value: PICKUP_POOL_INTENSITY },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    } );
}
