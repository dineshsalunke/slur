export const PICKUP_CLEAR_REACH = 120;

export const PICKUP_CLEAR_STEP = 0.5;

export const PICKUP_DECK_TOLERANCE = 0.05;

export const PICKUP_EMITTER = /* glsl */ `
uniform float uPickupHover;

bool reflEmitter( out vec3 base, out float h0, out float h1, out float power, out float point, out vec4 clear ) {
	base = instanceMatrix[ 3 ].xyz;
	h0 = uPickupHover;
	h1 = uPickupHover;
	power = instanceMatrix[ 0 ].x;
	point = 1.0;
	clear = instanceMatrix[ 1 ];
	return power > 0.0;
}
`;
