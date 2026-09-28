export const EXHAUST_REFLECTION_REACH = 6;

export const EXHAUST_EMITTER = /* glsl */ `
attribute vec3 aDrive;
attribute float aDeckY;
uniform float uExhaustReach;

bool reflEmitter( out vec3 base, out float h0, out float h1, out float power, out float point ) {
	vec3 origin = instanceMatrix[ 3 ].xyz;
	float h = origin.y - aDeckY;
	base = vec3( origin.x, aDeckY, origin.z );
	h0 = h;
	h1 = h;
	power = aDrive.z;
	point = 1.0;
	return h > 0.0 && h < uExhaustReach;
}
`;
