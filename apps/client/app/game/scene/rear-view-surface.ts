import * as THREE from 'three';

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fragmentShader = /* glsl */ `
#ifndef TONE_MAPPING
#include <tonemapping_pars_fragment>
#endif

uniform sampler2D uMap;
uniform int uToneMode;
uniform float uGain;
uniform float uFeatherX;
uniform float uFeatherY;

varying vec2 vUv;

vec3 toneMap( vec3 color ) {
    if ( uToneMode == ${ THREE.LinearToneMapping } ) return LinearToneMapping( color );
    if ( uToneMode == ${ THREE.ReinhardToneMapping } ) return ReinhardToneMapping( color );
    if ( uToneMode == ${ THREE.CineonToneMapping } ) return CineonToneMapping( color );
    if ( uToneMode == ${ THREE.ACESFilmicToneMapping } ) return ACESFilmicToneMapping( color );
    if ( uToneMode == ${ THREE.AgXToneMapping } ) return AgXToneMapping( color );
    if ( uToneMode == ${ THREE.NeutralToneMapping } ) return NeutralToneMapping( color );
    return color;
}

float edgeMask( vec2 uv ) {
    float x = smoothstep( 0.0, uFeatherX, uv.x ) * smoothstep( 1.0, 1.0 - uFeatherX, uv.x );
    float y = smoothstep( 0.0, uFeatherY, uv.y ) * smoothstep( 1.0, 1.0 - uFeatherY, uv.y );
    return x * y;
}

void main() {
    vec3 color = texture2D( uMap, vec2( 1.0 - vUv.x, vUv.y ) ).rgb;
    gl_FragColor = vec4( toneMap( max( color, 0.0 ) ), 1.0 );
    #include <colorspace_fragment>
    gl_FragColor.rgb *= uGain;
    gl_FragColor.a = edgeMask( vUv );
}
`;

export interface RearViewUniforms {
    [ uniform: string ]: THREE.IUniform;
    uMap: THREE.IUniform< THREE.Texture >;
    uToneMode: THREE.IUniform< number >;
    uGain: THREE.IUniform< number >;
    uFeatherX: THREE.IUniform< number >;
    uFeatherY: THREE.IUniform< number >;
}

export interface RearViewSurface extends THREE.ShaderMaterialParameters {
    uniforms: RearViewUniforms;
}

export function rearViewSurface( map: THREE.Texture ): RearViewSurface {
    return {
        uniforms: {
            uMap: { value: map },
            uToneMode: { value: THREE.NeutralToneMapping },
            uGain: { value: 1 },
            uFeatherX: { value: 0.22 },
            uFeatherY: { value: 0.18 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.NormalBlending,
        depthTest: false,
        depthWrite: false,
    };
}
