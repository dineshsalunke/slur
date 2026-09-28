export const PICKUP_EMITTER = /* glsl */ `
uniform float uPickupHover;

bool reflEmitter( out vec3 base, out float h0, out float h1, out float power, out float point ) {
	base = instanceMatrix[ 3 ].xyz;
	h0 = uPickupHover;
	h1 = uPickupHover;
	power = instanceMatrix[ 0 ].x;
	point = 1.0;
	return power > 0.0;
}
`;
