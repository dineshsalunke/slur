export const BLOCK_EMITTER = /* glsl */ `
attribute float aSlot;
attribute vec4 aSealedSeams;
attribute vec2 aSealedVariation;
attribute vec4 aSealedClear;
uniform float uBevel;
uniform float uSeamCore;

bool reflEmitter( out ReflEmitter e ) {
	e = ReflEmitter( vec3( 0.0 ), 0.0, 0.0, 0.0, 0.0, uSeamCore, 1e6 );
	if ( aSlot + 0.5 > aSealedVariation.x ) return false;
	vec3 centre = instanceMatrix[ 3 ].xyz;
	vec3 size = vec3( length( instanceMatrix[ 0 ].xyz ), length( instanceMatrix[ 1 ].xyz ), length( instanceMatrix[ 2 ].xyz ) );
	float a = max( 0.5 * size.x - uBevel, 1e-3 );
	float b = max( 0.5 * size.z - uBevel, 1e-3 );
	float u = aSlot < 0.5 ? aSealedSeams.x : aSlot < 1.5 ? aSealedSeams.y : aSlot < 2.5 ? aSealedSeams.z : aSealedSeams.w;
	float free = aSlot < 0.5 ? aSealedClear.x : aSlot < 1.5 ? aSealedClear.y : aSlot < 2.5 ? aSealedClear.z : aSealedClear.w;
	u = mod( u, 4.0 * ( a + b ) );
	vec2 offset;
	vec2 normal;
	if ( u < 2.0 * b ) {
		offset = vec2( 0.5 * size.x, u - b );
		normal = vec2( 1.0, 0.0 );
	} else if ( u < 2.0 * b + 2.0 * a ) {
		offset = vec2( a - ( u - 2.0 * b ), 0.5 * size.z );
		normal = vec2( 0.0, 1.0 );
	} else if ( u < 4.0 * b + 2.0 * a ) {
		offset = vec2( - 0.5 * size.x, b - ( u - 2.0 * b - 2.0 * a ) );
		normal = vec2( - 1.0, 0.0 );
	} else {
		offset = vec2( u - 4.0 * b - 3.0 * a, - 0.5 * size.z );
		normal = vec2( 0.0, - 1.0 );
	}
	e.base = vec3( centre.x + offset.x, centre.y - 0.5 * size.y, centre.z + offset.y );
	if ( dot( normal, cameraPosition.xz - e.base.xz ) <= 0.0 ) return false;
	e.h1 = size.y;
	e.power = 1.0;
	e.reach = reflFaceReach( normal, free, e.base );
	return true;
}
`;

export const SEAM_CLEAR_REACH = 1000;

export const SEAM_CONTACT = 0.05;

export const SEAM_LOW = 0.5;

export const _foot = { x: 0, z: 0, nx: 0, nz: 0 };
