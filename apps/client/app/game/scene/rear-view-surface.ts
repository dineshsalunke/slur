import * as THREE from 'three';

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform float uExposure;
uniform float uGain;
uniform float uFeatherX;
uniform float uFeatherY;

varying vec2 vUv;

vec3 neutralToneMap( vec3 color ) {
    const float startCompression = 0.8 - 0.04;
    const float desaturation = 0.15;

    color *= uExposure;

    float x = min( color.r, min( color.g, color.b ) );
    float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
    color -= offset;

    float peak = max( color.r, max( color.g, color.b ) );
    if ( peak < startCompression ) return color;

    float d = 1.0 - startCompression;
    float newPeak = 1.0 - d * d / ( peak + d - startCompression );
    color *= newPeak / peak;

    float g = 1.0 - 1.0 / ( desaturation * ( peak - newPeak ) + 1.0 );
    return mix( color, vec3( newPeak ), g );
}

float edgeMask( vec2 uv ) {
    float x = smoothstep( 0.0, uFeatherX, uv.x ) * smoothstep( 1.0, 1.0 - uFeatherX, uv.x );
    float y = smoothstep( 0.0, uFeatherY, uv.y ) * smoothstep( 1.0, 1.0 - uFeatherY, uv.y );
    return x * y;
}

void main() {
    vec3 color = texture2D( uMap, vec2( 1.0 - vUv.x, vUv.y ) ).rgb;
    gl_FragColor = vec4( neutralToneMap( max( color, 0.0 ) ), 1.0 );
    #include <colorspace_fragment>
    gl_FragColor.rgb *= uGain;
    gl_FragColor.a = edgeMask( vUv );
}
`;

export interface RearViewUniforms {
    [ uniform: string ]: THREE.IUniform;
    uMap: THREE.IUniform< THREE.Texture >;
    uExposure: THREE.IUniform< number >;
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
            uExposure: { value: 1 },
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
