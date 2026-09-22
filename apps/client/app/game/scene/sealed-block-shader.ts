import * as THREE from 'three';
import { accentDerived } from './accent';
import type { BlockDims } from './sealed-block-geometry';
import {
    SEALED_BLOCK_SEAM_WIDTH,
    SEALED_BLOCK_WEAR,
    SEALED_BLOCK_WEAR_ROUGHNESS,
    SEALED_BLOCK_WEAR_VALUE,
    type SealedBlockWear,
    sealedBlockInset,
    sealedBlockSeamCount,
    sealedBlockSeams,
} from './sealed-block-variation';
import { MARIGOLD_REFERENCE_INTENSITY } from './track-materials';

export interface SealedBlockUniforms {
    uSealedInset: { value: THREE.Vector2 };
    uSealedSeams: { value: THREE.Vector4 };
    uSealedSeamCount: { value: number };
    uSealedSeamWidth: { value: number };
    uSealedSeamColor: { value: THREE.Color };
    uSealedWear: { value: THREE.Vector4 };
    uSealedWearTone: { value: THREE.Vector2 };
    uSealedWearOrigin: { value: THREE.Vector3 };
}

export interface SealedBlockLook {
    seed: number;
    seamCount?: number;
    wear?: Partial< SealedBlockWear >;
}

const SEAM_RADIANCE = accentDerived( ( base, out ) => {
    out.copy( base ).multiplyScalar( MARIGOLD_REFERENCE_INTENSITY );
} );

export function sealedBlockUniforms( dims: BlockDims, look: SealedBlockLook ): SealedBlockUniforms {
    const [ a, b ] = sealedBlockInset( dims );
    const count = look.seamCount ?? sealedBlockSeamCount( look.seed );
    const seams = sealedBlockSeams( look.seed, count, dims );
    const wear = { ...SEALED_BLOCK_WEAR, ...look.wear };

    return {
        uSealedInset: { value: new THREE.Vector2( a, b ) },
        uSealedSeams: {
            value: new THREE.Vector4(
                ...( [ 0, 1, 2, 3 ].map( ( i ) => seams[ i ] ?? 0 ) as [ number, number, number, number ] ),
            ),
        },
        uSealedSeamCount: { value: seams.length },
        uSealedSeamWidth: { value: SEALED_BLOCK_SEAM_WIDTH },
        uSealedSeamColor: { value: SEAM_RADIANCE },
        uSealedWear: { value: new THREE.Vector4( wear.scale, wear.coverage, wear.contrast, wear.strength ) },
        uSealedWearTone: { value: new THREE.Vector2( SEALED_BLOCK_WEAR_VALUE, SEALED_BLOCK_WEAR_ROUGHNESS ) },
        uSealedWearOrigin: { value: new THREE.Vector3( look.seed % 997, 0, ( look.seed >> 8 ) % 991 ) },
    };
}

const VERT_HEAD = `
varying vec3 vSealedWorld;
varying vec3 vSealedOffset;
`;

const VERT_BODY = `
mat4 sealedModel = modelMatrix;
#ifdef USE_INSTANCING
	sealedModel = modelMatrix * instanceMatrix;
#endif
vec4 sealedWorld = sealedModel * vec4( transformed, 1.0 );
vSealedWorld = sealedWorld.xyz;
vSealedOffset = sealedWorld.xyz - sealedModel[ 3 ].xyz;
`;

const FRAG_HEAD = `
varying vec3 vSealedWorld;
varying vec3 vSealedOffset;
uniform vec2 uSealedInset;
uniform vec4 uSealedSeams;
uniform float uSealedSeamCount;
uniform float uSealedSeamWidth;
uniform vec3 uSealedSeamColor;
uniform vec4 uSealedWear;
uniform vec2 uSealedWearTone;
uniform vec3 uSealedWearOrigin;

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
	if ( uSealedWear.w <= 0.0 ) return 0.0;
	float n = sealedNoise( ( vSealedWorld + uSealedWearOrigin ) / max( uSealedWear.x, 1e-3 ) );
	float edge = mix( 0.30, 0.02, clamp( uSealedWear.z, 0.0, 1.0 ) );
	float t = mix( 0.90, 0.10, clamp( uSealedWear.y, 0.0, 1.0 ) );
	return smoothstep( t - edge, t + edge, n ) * uSealedWear.w;
}

// Clamping to the INSET rectangle collapses each chamfer strip to a single perimeter value, so a seam
// crossing a corner wraps it instead of stepping sideways by the bevel width.
float sealedPerimeterU( vec3 n ) {
	float a = uSealedInset.x;
	float b = uSealedInset.y;
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
	float perimeter = 4.0 * ( uSealedInset.x + uSealedInset.y );
	float u = sealedPerimeterU( n );
	float halfW = 0.5 * uSealedSeamWidth;
	// fwidth explodes where u wraps at the 0/perimeter corner; clamped, that artefact stays sub-pixel.
	float feather = clamp( fwidth( u ), 0.0, 0.05 );
	float s = sealedSeamAt( u, uSealedSeams.x, perimeter, halfW, feather ) * step( 0.5, uSealedSeamCount );
	s = max( s, sealedSeamAt( u, uSealedSeams.y, perimeter, halfW, feather ) * step( 1.5, uSealedSeamCount ) );
	s = max( s, sealedSeamAt( u, uSealedSeams.z, perimeter, halfW, feather ) * step( 2.5, uSealedSeamCount ) );
	s = max( s, sealedSeamAt( u, uSealedSeams.w, perimeter, halfW, feather ) * step( 3.5, uSealedSeamCount ) );
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
                '#include <map_fragment>\nfloat sealedWear = sealedWearPatch();\ndiffuseColor.rgb *= mix( 1.0, uSealedWearTone.x, sealedWear );',
            )
            .replace(
                '#include <roughnessmap_fragment>',
                '#include <roughnessmap_fragment>\nroughnessFactor = clamp( roughnessFactor + uSealedWearTone.y * sealedWear, 0.0, 1.0 );',
            )
            .replace(
                '#include <emissivemap_fragment>',
                '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uSealedSeamColor * sealedSeam( transformNormalByInverseViewMatrix( normal, viewMatrix ) );',
            );
    };
    mat.needsUpdate = true;
}
