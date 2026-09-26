export const DISSOLVE_DURATION = 0.7;
export const DISSOLVE_NOISE_SCALE = 1.8;
export const DISSOLVE_EDGE_WIDTH = 0.09;
export const DISSOLVE_EDGE_INTENSITY = 2.6;

export const DISSOLVE_FRAG_HEAD = `
uniform float uDissolve;
uniform float uNoiseScale;
uniform float uEdgeWidth;
uniform vec3 uEdgeColor;
uniform float uEdgeIntensity;
varying vec3 vDissolvePos;
float dsvHash( vec3 p ) { return fract( sin( dot( p, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453123 ); }
float dsvNoise( vec3 x ) {
    vec3 i = floor( x ); vec3 f = fract( x ); f = f * f * ( 3.0 - 2.0 * f );
    return mix(
        mix( mix( dsvHash( i + vec3( 0., 0., 0. ) ), dsvHash( i + vec3( 1., 0., 0. ) ), f.x ),
             mix( dsvHash( i + vec3( 0., 1., 0. ) ), dsvHash( i + vec3( 1., 1., 0. ) ), f.x ), f.y ),
        mix( mix( dsvHash( i + vec3( 0., 0., 1. ) ), dsvHash( i + vec3( 1., 0., 1. ) ), f.x ),
             mix( dsvHash( i + vec3( 0., 1., 1. ) ), dsvHash( i + vec3( 1., 1., 1. ) ), f.x ), f.y ), f.z );
}
`;

export const DISSOLVE_DISCARD = `
    float dsvN = dsvNoise( vDissolvePos * uNoiseScale );
    if ( uDissolve > 0.001 && dsvN < uDissolve ) discard;
`;

export const DISSOLVE_EDGE = `
    if ( uDissolve > 0.001 ) {
        float dsvEdge = 1.0 - smoothstep( uDissolve, uDissolve + uEdgeWidth, dsvN );
        gl_FragColor.rgb += uEdgeColor * dsvEdge * uEdgeIntensity;
    }
`;

export const HULL_PROJECTION = `
#include <uv_vertex>
{
	vec3 hullAxis = abs( normal );
	vec3 hullP = position * length( modelMatrix[ 0 ].xyz );
	vec2 hullUv = hullAxis.y > max( hullAxis.x, hullAxis.z )
		? hullP.xz
		: ( hullAxis.x > hullAxis.z ? hullP.zy : hullP.xy );
	hullUv /= uHullTexSpan;
	#ifdef USE_NORMALMAP
	vNormalMapUv = hullUv;
	#endif
	#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = hullUv;
	#endif
	#ifdef USE_METALNESSMAP
	vMetalnessMapUv = hullUv;
	#endif
}
`;
