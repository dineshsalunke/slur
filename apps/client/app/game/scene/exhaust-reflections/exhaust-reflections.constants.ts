export const EXHAUST_REFLECTION_REACH = 6;

export const EXHAUST_EMITTER = /* glsl */ `
attribute vec3 aDrive;
attribute float aDeckY;
uniform float uExhaustReach;

bool reflEmitter( out ReflEmitter e ) {
	vec3 origin = instanceMatrix[ 3 ].xyz;
	float h = origin.y - aDeckY;
	e = ReflEmitter( vec3( origin.x, aDeckY, origin.z ), h, h, aDrive.z, 1.0, 0.0, 1e6 );
	return h > 0.0 && h < uExhaustReach;
}
`;
