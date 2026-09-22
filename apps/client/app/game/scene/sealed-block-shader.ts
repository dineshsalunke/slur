import * as THREE from 'three';
import { accentDerived } from './accent';
import { SEALED_BLOCK_BEVEL, SEALED_BLOCK_UNIT_BEVEL } from './sealed-block-geometry';
import {
    SEALED_BLOCK_SEAM_WIDTH,
    SEALED_BLOCK_WEAR,
    SEALED_BLOCK_WEAR_COLOR,
    SEALED_BLOCK_WEAR_ROUGHNESS,
} from './sealed-block-variation';
import { MARIGOLD_REFERENCE_INTENSITY } from './track-materials';

export interface SealedBlockUniforms {
    uSealedBevel: { value: number };
    uSealedSeamWidth: { value: number };
    uSealedSeamColor: { value: THREE.Color };
    uSealedSeamIntensity: { value: number };
    uSealedWear: { value: THREE.Vector4 };
    uSealedWearMax: { value: number };
    uSealedWearColor: { value: THREE.Color };
    uSealedWearRoughness: { value: number };
}

const SEAM_BASE = accentDerived( ( base, out ) => {
    out.copy( base );
} );

export function sealedBlockUniforms(): SealedBlockUniforms {
    return {
        uSealedBevel: { value: SEALED_BLOCK_BEVEL },
        uSealedSeamWidth: { value: SEALED_BLOCK_SEAM_WIDTH },
        uSealedSeamColor: { value: SEAM_BASE },
        uSealedSeamIntensity: { value: MARIGOLD_REFERENCE_INTENSITY },
        uSealedWear: {
            value: new THREE.Vector4(
                SEALED_BLOCK_WEAR.scale,
                SEALED_BLOCK_WEAR.coverage,
                SEALED_BLOCK_WEAR.contrast,
                SEALED_BLOCK_WEAR.grain,
            ),
        },
        uSealedWearMax: { value: 0 },
        uSealedWearColor: { value: new THREE.Color( SEALED_BLOCK_WEAR_COLOR ).convertSRGBToLinear() },
        uSealedWearRoughness: { value: SEALED_BLOCK_WEAR_ROUGHNESS },
    };
}

const FACE_EDGE = ( 0.5 - 0.5 * SEALED_BLOCK_UNIT_BEVEL ).toFixed( 4 );

const VERT_HEAD = `
attribute vec4 aSealedSeams;
attribute vec2 aSealedVariation;
uniform float uSealedBevel;
varying vec3 vSealedWorld;
varying vec3 vSealedOffset;
varying vec2 vSealedInset;
varying vec4 vSealedSeams;
varying vec2 vSealedVariation;
`;

const VERT_BODY = `
mat4 sealedModel = modelMatrix * instanceMatrix;
vec3 sealedScale = vec3(
	length( instanceMatrix[ 0 ].xyz ),
	length( instanceMatrix[ 1 ].xyz ),
	length( instanceMatrix[ 2 ].xyz ) );
vec3 sealedBevel = min( uSealedBevel / max( sealedScale, vec3( 1e-3 ) ), vec3( 0.45 ) );
vec3 sealedMask = vec3( 1.0 ) - step( vec3( ${ FACE_EDGE } ), abs( transformed ) );
transformed = sign( transformed ) * ( vec3( 0.5 ) - sealedMask * sealedBevel );
vec4 sealedWorld = sealedModel * vec4( transformed, 1.0 );
vSealedWorld = sealedWorld.xyz;
vSealedOffset = sealedWorld.xyz - sealedModel[ 3 ].xyz;
vSealedInset = max( vec2( sealedScale.x, sealedScale.z ) * 0.5 - uSealedBevel, vec2( 1e-3 ) );
vSealedSeams = aSealedSeams;
vSealedVariation = aSealedVariation;
`;

const FRAG_HEAD = `
varying vec3 vSealedWorld;
varying vec3 vSealedOffset;
varying vec2 vSealedInset;
varying vec4 vSealedSeams;
varying vec2 vSealedVariation;
uniform float uSealedSeamWidth;
uniform vec3 uSealedSeamColor;
uniform float uSealedSeamIntensity;
uniform vec4 uSealedWear;
uniform float uSealedWearMax;
uniform vec3 uSealedWearColor;
uniform float uSealedWearRoughness;

float sealedHash( vec3 p ) {
	p = fract( p * 0.3183099 + vec3( 0.71, 0.113, 0.419 ) );
	p *= 17.0;
	return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}

float sealedNoise( vec3 x ) {
	vec3 i = floor( x );
	vec3 f = x - i;
	f = f * f * ( 3.0 - 2.0 * f );
	return mix(
		mix(
			mix( sealedHash( i ), sealedHash( i + vec3( 1, 0, 0 ) ), f.x ),
			mix( sealedHash( i + vec3( 0, 1, 0 ) ), sealedHash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
		mix(
			mix( sealedHash( i + vec3( 0, 0, 1 ) ), sealedHash( i + vec3( 1, 0, 1 ) ), f.x ),
			mix( sealedHash( i + vec3( 0, 1, 1 ) ), sealedHash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ),
		f.z );
}

float sealedWearPatch() {
	float strength = vSealedVariation.y * uSealedWearMax;
	if ( strength <= 0.0 ) return 0.0;
	vec3 p = vSealedWorld / max( uSealedWear.x, 1e-3 );
	float contrast = clamp( uSealedWear.z, 0.0, 1.0 );
	float n = sealedNoise( p ) + 0.25 * ( sealedNoise( p * 3.7 ) - 0.5 );
	float edge = mix( 0.16, 0.01, contrast );
	float t = mix( 0.90, 0.10, clamp( uSealedWear.y, 0.0, 1.0 ) );
	float patch = smoothstep( t - edge, t + edge, n );
	float grain = sealedNoise( p * max( uSealedWear.w, 1e-3 ) );
	return patch * mix( 0.4, 1.0, grain ) * strength;
}

// Clamping to the INSET rectangle collapses each chamfer strip to a single perimeter value, so a seam
// crossing a corner wraps it instead of stepping sideways by the bevel width.
float sealedPerimeterU( vec3 n ) {
	float a = vSealedInset.x;
	float b = vSealedInset.y;
	float px = clamp( vSealedOffset.x, - a, a );
	float pz = clamp( vSealedOffset.z, - b, b );
	if ( abs( n.x ) >= abs( n.z ) ) {
		return n.x > 0.0 ? pz + b : 2.0 * b + 2.0 * a + ( b - pz );
	}
	return n.z > 0.0 ? 2.0 * b + ( a - px ) : 4.0 * b + 2.0 * a + ( px + a );
}

float sealedSeamAt( float u, float pos, float perimeter, float halfW, float feather ) {
	float du = abs( u - pos );
	du = min( du, perimeter - du );
	return 1.0 - smoothstep( halfW - feather, halfW + feather, du );
}

float sealedSeam( vec3 n ) {
	float perimeter = 4.0 * ( vSealedInset.x + vSealedInset.y );
	float u = sealedPerimeterU( n );
	float halfW = 0.5 * uSealedSeamWidth;
	// fwidth explodes where u wraps at the 0/perimeter corner; clamped, that artefact stays sub-pixel.
	float feather = clamp( fwidth( u ), 0.0, 0.05 );
	float count = vSealedVariation.x;
	float s = sealedSeamAt( u, vSealedSeams.x, perimeter, halfW, feather ) * step( 0.5, count );
	s = max( s, sealedSeamAt( u, vSealedSeams.y, perimeter, halfW, feather ) * step( 1.5, count ) );
	s = max( s, sealedSeamAt( u, vSealedSeams.z, perimeter, halfW, feather ) * step( 2.5, count ) );
	s = max( s, sealedSeamAt( u, vSealedSeams.w, perimeter, halfW, feather ) * step( 3.5, count ) );
	// |n.y| is 0 on the four sides, 0.577 on a corner triangle, 0.707 on a top strip, 1 on the caps: board
	// 28's "no top-face luminous returns" holds by construction rather than by care.
	return s * ( 1.0 - smoothstep( 0.2, 0.45, abs( n.y ) ) );
}
`;

export function patchSealedBlock( mat: THREE.Material, u: SealedBlockUniforms ): void {
    if ( mat.userData.sealedPatched ) return;
    mat.userData.sealedPatched = true;
    mat.onBeforeCompile = ( shader ) => {
        Object.assign( shader.uniforms, u );
        shader.vertexShader = ( VERT_HEAD + shader.vertexShader ).replace(
            '#include <project_vertex>',
            `${ VERT_BODY }\n#include <project_vertex>`,
        );
        shader.fragmentShader = ( FRAG_HEAD + shader.fragmentShader )
            .replace(
                '#include <map_fragment>',
                '#include <map_fragment>\nfloat sealedWear = sealedWearPatch();\ndiffuseColor.rgb = mix( diffuseColor.rgb, uSealedWearColor, sealedWear );',
            )
            .replace(
                '#include <roughnessmap_fragment>',
                '#include <roughnessmap_fragment>\nroughnessFactor = clamp( roughnessFactor + uSealedWearRoughness * sealedWear, 0.0, 1.0 );',
            )
            .replace(
                '#include <emissivemap_fragment>',
                '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uSealedSeamColor * uSealedSeamIntensity * sealedSeam( transformNormalByInverseViewMatrix( normal, viewMatrix ) );',
            );
    };
    mat.needsUpdate = true;
}
