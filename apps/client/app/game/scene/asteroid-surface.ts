import * as THREE from 'three';

const ANISOTROPY = 8;

export const ROCK_ALBEDO = '#4a525a';

type Source = CanvasImageSource & { width: number; height: number };

function pixels( source: Source, ctx: CanvasRenderingContext2D, size: number ): Uint8ClampedArray {
    ctx.clearRect( 0, 0, size, size );
    ctx.drawImage( source, 0, 0, size, size );
    return ctx.getImageData( 0, 0, size, size ).data;
}

export function packRockSurface( diffuse: Source, arm: Source ): THREE.CanvasTexture {
    const size = diffuse.width;
    const canvas = document.createElement( 'canvas' );
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext( '2d', { willReadFrequently: true } );
    if ( ! ctx ) throw new Error( 'rock surface: 2d context unavailable' );

    const diff = pixels( diffuse, ctx, size );
    const occlusion = pixels( arm, ctx, size );
    const lum = new Float32Array( size * size );
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for ( let i = 0; i < lum.length; i++ ) {
        const l = 0.2126 * diff[ i * 4 ] + 0.7152 * diff[ i * 4 + 1 ] + 0.0722 * diff[ i * 4 + 2 ];
        lum[ i ] = l;
        lo = Math.min( lo, l );
        hi = Math.max( hi, l );
    }

    const packed = ctx.createImageData( size, size );
    const out = packed.data;
    const span = Math.max( 1, hi - lo );
    for ( let i = 0; i < lum.length; i++ ) {
        out[ i * 4 ] = occlusion[ i * 4 ];
        out[ i * 4 + 1 ] = occlusion[ i * 4 + 1 ];
        out[ i * 4 + 2 ] = Math.round( ( ( lum[ i ] - lo ) / span ) * 255 );
        out[ i * 4 + 3 ] = 255;
    }
    ctx.putImageData( packed, 0, 0 );

    const texture = new THREE.CanvasTexture( canvas );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = ANISOTROPY;
    return texture;
}

export function prepareRockNormal( texture: THREE.Texture ): THREE.Texture {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = ANISOTROPY;
    texture.needsUpdate = true;
    return texture;
}

export interface RockUniforms {
    uRockTime: { value: number };
    uRockSpin: { value: number };
    uRockDrift: { value: number };
    uRockSurface: { value: THREE.Texture };
    uRockNormal: { value: THREE.Texture };
    uRockTexScale: { value: number };
    uRockNormalScale: { value: number };
    uRockRough: { value: number };
    uRockDetail: { value: number };
    uRockColor: { value: THREE.Color };
    uRockFar: { value: number };
    uRockKeyDir: { value: THREE.Vector3 };
    uRockKeyColor: { value: THREE.Color };
}

export function rockUniforms( surface: THREE.Texture, normal: THREE.Texture ): RockUniforms {
    return {
        uRockTime: { value: 0 },
        uRockSpin: { value: 1 },
        uRockDrift: { value: 1 },
        uRockSurface: { value: surface },
        uRockNormal: { value: normal },
        uRockTexScale: { value: 1 },
        uRockNormalScale: { value: 1 },
        uRockRough: { value: 1 },
        uRockDetail: { value: 1 },
        uRockColor: { value: new THREE.Color() },
        uRockFar: { value: 1000 },
        uRockKeyDir: { value: new THREE.Vector3( 0, 1, 0 ) },
        uRockKeyColor: { value: new THREE.Color( 0, 0, 0 ) },
    };
}

const VERT_HEAD = `
attribute vec4 aRockSpin;
uniform float uRockTime;
uniform float uRockSpin;
uniform float uRockDrift;
varying vec3 vRockPos;
varying vec3 vRockNormal;
varying vec3 vRockAxX;
varying vec3 vRockAxY;
varying vec3 vRockAxZ;
varying float vRockDepth;

mat3 rockRotation( vec3 a, float angle ) {
	float s = sin( angle );
	float c = cos( angle );
	float t = 1.0 - c;
	return mat3(
		t * a.x * a.x + c, t * a.x * a.y + s * a.z, t * a.x * a.z - s * a.y,
		t * a.x * a.y - s * a.z, t * a.y * a.y + c, t * a.y * a.z + s * a.x,
		t * a.x * a.z + s * a.y, t * a.y * a.z - s * a.x, t * a.z * a.z + c );
}

vec3 rockNormalToView( vec3 n ) {
	mat3 m = mat3( instanceMatrix );
	n /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
	return normalMatrix * ( m * n );
}
`;

const VERT_NORMAL = `
#include <beginnormal_vertex>
mat3 rockSpin = rockRotation( normalize( aRockSpin.xyz ), uRockTime * aRockSpin.w * uRockSpin );
vRockNormal = objectNormal;
objectNormal = rockSpin * objectNormal;
vRockAxX = rockNormalToView( rockSpin * vec3( 1.0, 0.0, 0.0 ) );
vRockAxY = rockNormalToView( rockSpin * vec3( 0.0, 1.0, 0.0 ) );
vRockAxZ = rockNormalToView( rockSpin * vec3( 0.0, 0.0, 1.0 ) );
`;

const VERT_POSITION = `
#include <begin_vertex>
vRockPos = transformed;
transformed = rockSpin * transformed
	+ normalize( aRockSpin.zxy ) * sin( uRockTime * 0.11 + aRockSpin.w * 57.0 ) * 0.04 * uRockDrift;
`;

const VERT_DEPTH = `
#include <project_vertex>
vRockDepth = - mvPosition.z;
`;

const FRAG_HEAD = `
uniform sampler2D uRockSurface;
uniform sampler2D uRockNormal;
uniform float uRockTexScale;
uniform float uRockNormalScale;
uniform float uRockRough;
uniform float uRockDetail;
uniform vec3 uRockColor;
uniform float uRockFar;
uniform vec3 uRockKeyDir;
uniform vec3 uRockKeyColor;
varying vec3 vRockPos;
varying vec3 vRockNormal;
varying vec3 vRockAxX;
varying vec3 vRockAxY;
varying vec3 vRockAxZ;
varying float vRockDepth;
`;

const FRAG_SAMPLE = `
#include <clipping_planes_fragment>
float rockDither = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
if ( smoothstep( uRockFar, uRockFar * 0.8, vRockDepth ) < rockDither ) discard;
vec3 rockN = normalize( vRockNormal );
vec3 rockW = pow( abs( rockN ), vec3( 4.0 ) );
rockW /= dot( rockW, vec3( 1.0 ) );
vec3 rockP = vRockPos * uRockTexScale;
vec4 rockS = texture2D( uRockSurface, rockP.zy ) * rockW.x
	+ texture2D( uRockSurface, rockP.xz ) * rockW.y
	+ texture2D( uRockSurface, rockP.xy ) * rockW.z;
`;

const FRAG_COLOR = `
#include <color_fragment>
diffuseColor.rgb = uRockColor * mix( 1.0, mix( 0.35, 1.9, rockS.b ) * mix( 1.0, rockS.r, 0.85 ), uRockDetail );
`;

const FRAG_ROUGHNESS = `
#include <roughnessmap_fragment>
roughnessFactor = clamp( rockS.g * uRockRough, 0.05, 1.0 );
`;

const FRAG_NORMAL = `
#include <normal_fragment_maps>
vec3 rockTx = texture2D( uRockNormal, rockP.zy ).xyz * 2.0 - 1.0;
vec3 rockTy = texture2D( uRockNormal, rockP.xz ).xyz * 2.0 - 1.0;
vec3 rockTz = texture2D( uRockNormal, rockP.xy ).xyz * 2.0 - 1.0;
rockTx.xy *= uRockNormalScale;
rockTy.xy *= uRockNormalScale;
rockTz.xy *= uRockNormalScale;
rockTx = vec3( rockTx.xy + rockN.zy, abs( rockTx.z ) * rockN.x );
rockTy = vec3( rockTy.xy + rockN.xz, abs( rockTy.z ) * rockN.y );
rockTz = vec3( rockTz.xy + rockN.xy, abs( rockTz.z ) * rockN.z );
vec3 rockObjN = normalize( rockTx.zyx * rockW.x + rockTy.xzy * rockW.y + rockTz.xyz * rockW.z );
normal = normalize( mat3( vRockAxX, vRockAxY, vRockAxZ ) * rockObjN );
`;

const FRAG_KEY = `
#include <lights_fragment_end>
reflectedLight.directDiffuse += BRDF_Lambert( material.diffuseColor ) * uRockKeyColor * max( dot( normal, mat3( viewMatrix ) * uRockKeyDir ), 0.0 );
`;

export function patchRock( material: THREE.MeshStandardMaterial, uniforms: RockUniforms ): void {
    material.onBeforeCompile = ( shader ) => {
        Object.assign( shader.uniforms, uniforms );
        shader.vertexShader =
            VERT_HEAD +
            shader.vertexShader
                .replace( '#include <beginnormal_vertex>', VERT_NORMAL )
                .replace( '#include <begin_vertex>', VERT_POSITION )
                .replace( '#include <project_vertex>', VERT_DEPTH );
        shader.fragmentShader =
            FRAG_HEAD +
            shader.fragmentShader
                .replace( '#include <clipping_planes_fragment>', FRAG_SAMPLE )
                .replace( '#include <color_fragment>', FRAG_COLOR )
                .replace( '#include <roughnessmap_fragment>', FRAG_ROUGHNESS )
                .replace( '#include <normal_fragment_maps>', FRAG_NORMAL )
                .replace( '#include <lights_fragment_end>', FRAG_KEY );
    };
    material.customProgramCacheKey = () => 'slur-rock';
}
