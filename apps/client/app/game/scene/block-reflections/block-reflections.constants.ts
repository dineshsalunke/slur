export const BLOCK_EMITTER = /* glsl */ `
attribute float aSlot;
attribute vec4 aSealedSeams;
attribute vec2 aSealedVariation;
uniform float uBevel;

bool reflEmitter( out vec3 base, out float h0, out float h1, out float power, out float point ) {
	base = vec3( 0.0 );
	h0 = 0.0;
	h1 = 0.0;
	power = 0.0;
	point = 0.0;
	if ( aSlot + 0.5 > aSealedVariation.x ) return false;
	vec3 centre = instanceMatrix[ 3 ].xyz;
	vec3 size = vec3( length( instanceMatrix[ 0 ].xyz ), length( instanceMatrix[ 1 ].xyz ), length( instanceMatrix[ 2 ].xyz ) );
	float a = max( 0.5 * size.x - uBevel, 1e-3 );
	float b = max( 0.5 * size.z - uBevel, 1e-3 );
	float u = aSlot < 0.5 ? aSealedSeams.x : aSlot < 1.5 ? aSealedSeams.y : aSlot < 2.5 ? aSealedSeams.z : aSealedSeams.w;
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
	base = vec3( centre.x + offset.x, centre.y - 0.5 * size.y, centre.z + offset.y );
	if ( dot( normal, cameraPosition.xz - base.xz ) <= 0.0 ) return false;
	h1 = size.y;
	power = 1.0;
	return true;
}
`;
