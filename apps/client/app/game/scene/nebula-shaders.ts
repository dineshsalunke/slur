import { NEBULA_NOISE_GLSL } from './nebula-noise';

export const NEBULA_CUBE_VERTEX = `
varying vec3 vDir;
void main() {
	vDir = ( modelMatrix * vec4( position, 0.0 ) ).xyz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	gl_Position.z = gl_Position.w;
}
`;

export const NEBULA_PROBE_VERTEX = `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4( position.xy, 0.0, 1.0 );
}
`;

const NEBULA_BAND = `
uniform vec3 uBandNormal;
uniform float uBandOffset;
uniform float uBandWidth;

vec3 bandTangent() {
	return normalize( cross( uBandNormal, vec3( 0.0, 0.0, 1.0 ) ) );
}

vec3 bandFrame( vec3 d ) {
	vec3 t1 = bandTangent();
	vec3 t2 = cross( uBandNormal, t1 );
	return vec3( dot( d, uBandNormal ) - uBandOffset, dot( d, t1 ), dot( d, t2 ) );
}
`;

export const NEBULA_BAKE_FRAGMENT = `
uniform vec3 uSeed;
uniform float uScale;
uniform float uWarp;
uniform float uDensity;
uniform float uVoids;
uniform float uDust;
varying vec3 vDir;

${ NEBULA_NOISE_GLSL }

${ NEBULA_BAND }

vec3 warped( vec3 p ) {
	vec3 w1 = vec3(
		nbFbm( p + vec3( 1.7, 9.2, 3.1 ), 4 ),
		nbFbm( p + vec3( 8.3, 2.8, 5.4 ), 4 ),
		nbFbm( p + vec3( 4.1, 6.6, 7.9 ), 4 ) );
	vec3 r = p + uWarp * 1.2 * w1;
	vec3 w2 = vec3(
		nbFbm( r * 1.7 + vec3( 3.3, 1.2, 8.8 ), 4 ),
		nbFbm( r * 1.7 + vec3( 7.7, 4.4, 2.2 ), 4 ),
		nbFbm( r * 1.7 + vec3( 5.5, 9.9, 6.1 ), 4 ) );
	return p + uWarp * ( 0.8 * w1 + 0.5 * w2 );
}

float crest( float x ) {
	return smoothstep( -0.22, 0.0, x ) * exp( - max( x, 0.0 ) * 2.6 );
}

float crests( vec3 q, float b ) {
	float c = crest( b );
	c += 0.6 * crest( b + 1.1 + 0.4 * nbFbm( q * 0.6 + 21.0, 3 ) );
	c += 0.45 * crest( b - 1.3 + 0.4 * nbFbm( q * 0.6 + 37.0, 3 ) );
	c += 0.3 * crest( b + 2.6 + 0.5 * nbFbm( q * 0.5 + 53.0, 3 ) );
	return c;
}

void main() {
	vec3 d = normalize( vDir );
	vec3 frame = bandFrame( d );
	float b0 = frame.x;
	vec3 base = vec3( b0, frame.y, frame.z ) * uScale + uSeed;
	vec3 q = warped( base );
	vec3 p = mix( base, q, 0.5 );

	float meander = 0.3 * nbFbm( q * 0.7 + 3.0, 3 ) + 0.12 * nbFbm( q * 2.0 + 8.0, 4 );
	float b = ( b0 + uWarp * meander ) / uBandWidth + 0.35 * nbFbm( q * 3.0 + 8.0, 5 );
	float ridge = crests( q, b );
	float nearCrest = clamp( ridge * 1.4, 0.0, 1.0 );

	vec3 toCrest = vec3( - sign( b0 ) * 0.03 * uScale, 0.0, 0.0 );
	float lobes = nbBillow( p * 4.0 + 6.0, 6 );
	float lobesLit = nbBillow( ( p + toCrest ) * 4.0 + 6.0, 6 );
	float fine = nbBillow( q * 9.0 + 13.0, 4 );
	float fineLit = nbBillow( ( q + toCrest * 0.6 ) * 9.0 + 13.0, 4 );
	float shade = clamp( 0.5 + ( lobes - lobesLit ) * 4.0 + ( fine - fineLit ) * 3.0, 0.0, 1.0 );
	float body = nbFbm( q * 1.1, 5 ) * 0.5 + 0.5;
	float cloud = smoothstep( 0.1, 0.95, body * 0.45 + lobes * 0.5 + fine * 0.2 ) * ( 0.3 + 1.2 * shade );

	float haze = exp( - b * b / 2.5 ) * body * ( 0.4 + 0.8 * shade ) * ( 0.4 + cloud );
	float veil = nbFbm( q * 0.8 + 11.0, 4 ) * 0.9 + 0.5;
	float open = smoothstep( 1.0 - uVoids, 1.3 - uVoids, veil );
	float glow = ( ridge * ( 0.2 + 1.1 * cloud ) * uDensity * 2.4 + haze * 0.2 ) * mix( 1.0, 0.15, open );

	vec3 cq = q + 0.08 * vec3( nbFbm( q * 4.0 + 1.0, 3 ), nbFbm( q * 4.0 + 2.0, 3 ), nbFbm( q * 4.0 + 3.0, 3 ) );
	float clumps = nbFbm( cq * 4.0 + 50.0, 5 ) * 0.5 + 0.5;
	float pebbles = max(
		clamp( 1.0 - nbWorley( cq * 7.0 + 3.0 ) * 1.7, 0.0, 1.0 ),
		clamp( 1.0 - nbWorley( cq * 15.0 + 9.0 ) * 1.9, 0.0, 1.0 ) * 0.9 );
	float lanes = smoothstep( 0.55, 0.85, nbFbm( q * 1.6 + 70.0, 4 ) * 0.5 + 0.5 ) * exp( - b * b / 8.0 );
	float keep = smoothstep( 0.15, 0.7, nearCrest + lanes * 0.3 ) * uDust;
	float field = max( clumps * 0.85, pebbles * 0.9 + 0.1 * clumps );

	gl_FragColor = vec4( sqrt( clamp( glow * 0.5, 0.0, 1.0 ) ), mix( field * 0.5, field, keep ), nearCrest, clamp( cloud, 0.0, 1.0 ) );
}
`;

const NEBULA_SHADE = `
precision highp sampler3D;
uniform samplerCube uFields;
uniform sampler3D uNoise;
uniform vec3 uCloud;
uniform vec3 uRim;
uniform vec3 uDeep;
uniform float uBrightness;
uniform float uVoidDepth;
uniform float uDustOpacity;
uniform float uRimStrength;
uniform float uClumpEdge;
uniform float uTime;
uniform float uFlow;
uniform vec3 uPlanetDir;
uniform float uPlanetSin;
uniform vec3 uPlanetSun;
uniform float uPlanetLight;
uniform float uPlanetGlow;
uniform float uPlanetRelief;
uniform vec3 uMoonDir[ 2 ];
uniform float uMoonSin[ 2 ];

${ NEBULA_NOISE_GLSL }

${ NEBULA_BAND }

vec3 nbRotate( vec3 v, vec3 axis, float angle ) {
	float c = cos( angle );
	float s = sin( angle );
	return v * c + cross( axis, v ) * s + axis * dot( axis, v ) * ( 1.0 - c );
}

float nbStars( vec3 d, float cells, float cut, float twinkle ) {
	vec3 cell = floor( d * cells );
	vec3 h = vec3( nbPcg( uvec3( ivec3( cell ) + 65536 ) ) ) / 4294967295.0;
	if ( h.x < cut ) return 0.0;
	vec3 centre = ( cell + 0.5 + ( h.yzx - 0.5 ) * 0.3 ) / cells;
	float r = length( d - centre * ( dot( d, centre ) / dot( centre, centre ) ) ) * cells;
	float flicker = 1.0 - twinkle * ( 0.5 + 0.5 * sin( uTime * ( 1.5 + h.z * 3.0 ) + h.y * 40.0 ) );
	return exp( - r * r * 16.0 ) * pow( h.y, 6.0 ) * flicker;
}

float nbTerrain( vec3 sp ) {
	float coarse = texture( uNoise, sp * 0.6 ).r;
	float ridges = 1.0 - abs( texture( uNoise, sp * 1.6 + 0.13 ).g * 2.0 - 1.0 );
	float craters = smoothstep( 0.55, 0.9, texture( uNoise, sp * 3.2 + 0.61 ).b );
	return coarse * 0.5 + ridges * ridges * 0.35 - craters * 0.25;
}

vec4 nbGlobe( vec3 d, vec3 centre, float sinR, float seed, float detail ) {
	if ( sinR <= 0.0 ) return vec4( 0.0 );
	float cosA = dot( d, centre );
	if ( cosA <= 0.0 ) return vec4( 0.0 );
	vec3 v = d - centre * cosA;
	float len = length( v );
	float r = len / sinR;
	float edge = max( fwidth( r ), 0.002 );
	float cover = 1.0 - smoothstep( 1.0 - edge, 1.0 + edge, r );
	vec3 u = v / max( len, 1e-6 );
	float sunSide = clamp( dot( u, uPlanetSun - centre * dot( uPlanetSun, centre ) ) * 1.5 + 0.5, 0.0, 1.0 );
	float corona = exp( - max( r - 1.0, 0.0 ) * 12.0 ) * ( 1.0 - cover ) * ( 0.15 + 0.85 * sunSide );
	vec3 glow = uRim * corona * 0.7 * uPlanetGlow;
	if ( cover <= 0.0 ) return vec4( glow, clamp( corona * uPlanetGlow, 0.0, 1.0 ) );
	r = min( r, 1.0 );
	float z = sqrt( 1.0 - r * r );
	vec3 n = u * r - centre * z;
	vec3 sp = n * detail * 0.25 + seed;
	float h = nbTerrain( sp );
	vec3 t1 = normalize( cross( n, abs( n.y ) < 0.9 ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 ) ) );
	vec3 t2 = cross( n, t1 );
	float e = 0.015;
	float h1 = nbTerrain( sp + t1 * e * detail * 0.25 );
	float h2 = nbTerrain( sp + t2 * e * detail * 0.25 );
	vec3 bumped = normalize( n - ( t1 * ( h1 - h ) + t2 * ( h2 - h ) ) * ( 3.0 * uPlanetRelief / e ) * 0.05 );
	float ndl = dot( bumped, uPlanetSun );
	float day = smoothstep( -0.05, 0.5, dot( n, uPlanetSun ) );
	float albedo = mix( 0.03, 0.2, clamp( h, 0.0, 1.0 ) );
	float limb = pow( r, 16.0 ) * clamp( dot( n, uPlanetSun ) * 2.0 + 0.5, 0.0, 1.0 );
	float rimLight = pow( r, 6.0 ) * 0.12 * sunSide;
	vec3 body = uRim * ( albedo * ( day * max( ndl, 0.0 ) + 0.08 ) + rimLight * uPlanetGlow ) + uDeep * 1.5;
	vec3 c = ( body + uRim * limb * 0.35 * uPlanetGlow ) * uPlanetLight;
	return vec4( mix( glow, c, cover ), max( cover, clamp( corona * uPlanetGlow, 0.0, 1.0 ) ) );
}

vec3 nebulaShade( vec3 d ) {
	vec3 frame = bandFrame( d );
	float b = frame.x / uBandWidth;
	float along = atan( frame.z, frame.y );

	float speed = 1.0 / ( abs( b ) * 0.5 + 0.5 );
	float phase = uTime * 0.025;
	float p0 = fract( phase );
	float p1 = fract( phase + 0.5 );
	float blend = abs( p0 * 2.0 - 1.0 );
	float amp = 0.08 * uFlow * speed;
	vec3 d0 = nbRotate( d, uBandNormal, ( p0 - 0.5 ) * amp );
	vec3 d1 = nbRotate( d, uBandNormal, ( p1 - 0.5 ) * amp );
	vec3 toCrest = - sign( frame.x ) * uBandNormal * 0.006;

	vec4 f = mix( textureCube( uFields, d0 ), textureCube( uFields, d1 ), blend );
	vec4 fl = mix( textureCube( uFields, d0 + toCrest ), textureCube( uFields, d1 + toCrest ), blend );

	float hf = ( texture( uNoise, d * 1.25 ).r * 0.6 + texture( uNoise, d * 3.5 + 0.37 ).g * 0.4 ) * 2.0 - 1.0;
	float glow = 2.0 * f.r * f.r;
	glow = pow( glow, 1.0 + uVoidDepth ) * ( 0.6 + 0.8 * f.a ) * ( 1.0 + 0.15 * hf );
	float stream = texture( uNoise, vec3( along * 10.0 - uTime * 0.12 * uFlow, b * 2.5, uTime * 0.03 * uFlow ) / 16.0 ).b * 2.0 - 1.0;
	glow *= max( 0.0, 1.0 + uFlow * 0.6 * stream * f.b );

	float edgeField = f.g + 0.12 * hf;
	float clump = smoothstep( uClumpEdge - 0.02, uClumpEdge + 0.02, edgeField );
	float halo = smoothstep( uClumpEdge - 0.18, uClumpEdge, edgeField );
	float slope = clamp( ( f.g - fl.g ) * 40.0, 0.0, 1.0 ) * f.b;
	float rim = slope * ( 1.0 - smoothstep( 0.0, 0.06, abs( edgeField - uClumpEdge ) ) );
	float rimGlow = slope * ( 1.0 - smoothstep( 0.0, 0.2, abs( edgeField - uClumpEdge ) ) );

	vec3 tint = mix( uCloud, uRim, clamp( glow * 0.8, 0.0, 1.0 ) );
	vec3 c = uDeep + tint * glow * uBrightness;
	c *= 1.0 - 0.35 * uDustOpacity * halo;
	c = mix( c, uDeep * ( 1.5 + hf ), uDustOpacity * clump );
	c += uRim * ( rim + 0.3 * rimGlow ) * uRimStrength * uBrightness * 0.6 * ( 0.4 + glow );
	float stars = nbStars( d, 700.0, 0.985, 0.3 ) + nbStars( d, 160.0, 0.996, 0.5 ) * 1.6;
	c += vec3( 0.85, 0.9, 1.0 ) * stars * ( 1.0 - clump ) * 2.0;

	vec4 globe = nbGlobe( d, uPlanetDir, uPlanetSin, 3.1, 6.0 );
	c = mix( c, globe.rgb, globe.a );
	for ( int i = 0; i < 2; i++ ) {
		vec4 moon = nbGlobe( d, uMoonDir[ i ], uMoonSin[ i ], 7.0 + float( i ) * 5.3, 14.0 );
		c = mix( c, moon.rgb, moon.a );
	}
	return 0.56 - 0.56 * exp( - c / 0.56 );
}
`;

export const NEBULA_BACKGROUND_FRAGMENT = `
varying vec3 vDir;

${ NEBULA_SHADE }

float nbIgn( vec2 px ) {
	return fract( 52.9829189 * fract( dot( px, vec2( 0.06711056, 0.00583715 ) ) ) );
}

void main() {
	gl_FragColor = vec4( nebulaShade( normalize( vDir ) ), 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	gl_FragColor.rgb = max( gl_FragColor.rgb + ( nbIgn( gl_FragCoord.xy ) - 0.5 ) / 255.0, 0.0 );
}
`;

export const NEBULA_LIGHT_FRAGMENT = `
uniform float uEnvGain;
uniform vec3 uEnvFill;
varying vec3 vDir;

${ NEBULA_SHADE }

void main() {
	vec3 d = normalize( vDir );
	gl_FragColor = vec4( nebulaShade( d ) * uEnvGain + uEnvFill * ( 0.6 + 0.4 * d.y ), 1.0 );
}
`;

export const NEBULA_PROBE_FRAGMENT = `
varying vec2 vUv;

${ NEBULA_SHADE }

vec3 nbEncode( vec3 c ) {
	return mix( c * 12.92, 1.055 * pow( c, vec3( 1.0 / 2.4 ) ) - 0.055, step( vec3( 0.0031308 ), c ) );
}

void main() {
	float lon = ( vUv.x - 0.5 ) * 6.2831853;
	float lat = ( vUv.y - 0.5 ) * 3.1415927;
	vec3 d = vec3( cos( lat ) * sin( lon ), sin( lat ), cos( lat ) * cos( lon ) );
	gl_FragColor = vec4( nbEncode( clamp( nebulaShade( d ), 0.0, 1.0 ) ), 1.0 );
}
`;
