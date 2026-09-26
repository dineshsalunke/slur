import * as THREE from 'three';

const BEZEL_PX = 3;
const LIP_PX = 1;
const BEZEL_COLOR = '#1C252C';
const LIP_COLOR = '#F59A24';

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
uniform vec2 uSize;
uniform float uBezelPx;
uniform float uLipPx;
uniform vec3 uBezel;
uniform vec3 uLip;

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

float edgeDistancePx( vec2 uv ) {
    vec2 d = min( uv, 1.0 - uv ) * uSize;
    return min( d.x, d.y );
}

void main() {
    vec3 color = texture2D( uMap, vec2( 1.0 - vUv.x, vUv.y ) ).rgb;
    gl_FragColor = vec4( neutralToneMap( max( color, 0.0 ) ), 1.0 );
    #include <colorspace_fragment>
    gl_FragColor.rgb *= uGain;

    float edge = edgeDistancePx( vUv );
    if ( edge < uBezelPx + uLipPx ) gl_FragColor.rgb = uLip;
    if ( edge < uBezelPx ) gl_FragColor.rgb = uBezel;
}
`;

function srgbTriple( hex: string ): THREE.Color {
    return new THREE.Color( hex ).convertLinearToSRGB();
}

export interface RearViewUniforms {
    [ uniform: string ]: THREE.IUniform;
    uMap: THREE.IUniform< THREE.Texture >;
    uExposure: THREE.IUniform< number >;
    uGain: THREE.IUniform< number >;
    uSize: THREE.IUniform< THREE.Vector2 >;
    uBezelPx: THREE.IUniform< number >;
    uLipPx: THREE.IUniform< number >;
    uBezel: THREE.IUniform< THREE.Color >;
    uLip: THREE.IUniform< THREE.Color >;
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
            uSize: { value: new THREE.Vector2( 1, 1 ) },
            uBezelPx: { value: BEZEL_PX },
            uLipPx: { value: LIP_PX },
            uBezel: { value: srgbTriple( BEZEL_COLOR ) },
            uLip: { value: srgbTriple( LIP_COLOR ) },
        },
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
    };
}
