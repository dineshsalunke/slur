export const PICKUP_CLEAR_REACH = 120;

export const PICKUP_CLEAR_STEP = 0.5;

export const PICKUP_DECK_TOLERANCE = 0.05;

export const PICKUP_EMITTER = /* glsl */ `
uniform float uPickupHover;

bool reflEmitter( out ReflEmitter e ) {
	vec3 base = instanceMatrix[ 3 ].xyz;
	e = ReflEmitter( base, uPickupHover, uPickupHover, instanceMatrix[ 0 ].x, 1.0, 0.0, reflBoxReach( instanceMatrix[ 1 ], base ) );
	return e.power > 0.0;
}
`;
