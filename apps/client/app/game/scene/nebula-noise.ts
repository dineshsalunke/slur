export const NEBULA_NOISE_GLSL = `
uvec3 nbPcg( uvec3 v ) {
	v = v * 1664525u + 1013904223u;
	v.x += v.y * v.z;
	v.y += v.z * v.x;
	v.z += v.x * v.y;
	v ^= v >> 16u;
	v.x += v.y * v.z;
	v.y += v.z * v.x;
	v.z += v.x * v.y;
	return v;
}

vec3 nbGrad( vec3 cell ) {
	uvec3 h = nbPcg( uvec3( ivec3( cell ) + 32768 ) );
	return vec3( h ) * ( 2.0 / 4294967295.0 ) - 1.0;
}

float nbNoise( vec3 p ) {
	vec3 i = floor( p );
	vec3 f = fract( p );
	vec3 u = f * f * f * ( f * ( f * 6.0 - 15.0 ) + 10.0 );
	float n000 = dot( nbGrad( i ), f );
	float n100 = dot( nbGrad( i + vec3( 1.0, 0.0, 0.0 ) ), f - vec3( 1.0, 0.0, 0.0 ) );
	float n010 = dot( nbGrad( i + vec3( 0.0, 1.0, 0.0 ) ), f - vec3( 0.0, 1.0, 0.0 ) );
	float n110 = dot( nbGrad( i + vec3( 1.0, 1.0, 0.0 ) ), f - vec3( 1.0, 1.0, 0.0 ) );
	float n001 = dot( nbGrad( i + vec3( 0.0, 0.0, 1.0 ) ), f - vec3( 0.0, 0.0, 1.0 ) );
	float n101 = dot( nbGrad( i + vec3( 1.0, 0.0, 1.0 ) ), f - vec3( 1.0, 0.0, 1.0 ) );
	float n011 = dot( nbGrad( i + vec3( 0.0, 1.0, 1.0 ) ), f - vec3( 0.0, 1.0, 1.0 ) );
	float n111 = dot( nbGrad( i + vec3( 1.0, 1.0, 1.0 ) ), f - vec3( 1.0, 1.0, 1.0 ) );
	return mix(
		mix( mix( n000, n100, u.x ), mix( n010, n110, u.x ), u.y ),
		mix( mix( n001, n101, u.x ), mix( n011, n111, u.x ), u.y ),
		u.z );
}

const mat3 NB_ROT = mat3( 0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64 );

float nbFbm( vec3 p, int octaves ) {
	float sum = 0.0;
	float amp = 0.5;
	for ( int i = 0; i < 8; i++ ) {
		if ( i >= octaves ) break;
		sum += amp * nbNoise( p );
		p = NB_ROT * p * 2.03;
		amp *= 0.5;
	}
	return sum;
}

float nbBillow( vec3 p, int octaves ) {
	float sum = 0.0;
	float amp = 0.5;
	for ( int i = 0; i < 8; i++ ) {
		if ( i >= octaves ) break;
		sum += amp * abs( nbNoise( p ) ) * 1.6;
		p = NB_ROT * p * 2.11;
		amp *= 0.5;
	}
	return sum;
}

float nbRidged( vec3 p, int octaves ) {
	float sum = 0.0;
	float amp = 0.5;
	float prev = 1.0;
	for ( int i = 0; i < 8; i++ ) {
		if ( i >= octaves ) break;
		float n = 1.0 - abs( nbNoise( p ) * 1.4 );
		n *= n;
		sum += amp * n * prev;
		prev = n;
		p = NB_ROT * p * 2.07;
		amp *= 0.5;
	}
	return sum;
}

float nbWorley( vec3 p ) {
	vec3 i = floor( p );
	vec3 f = fract( p );
	float best = 8.0;
	for ( int z = -1; z <= 1; z++ ) {
		for ( int y = -1; y <= 1; y++ ) {
			for ( int x = -1; x <= 1; x++ ) {
				vec3 o = vec3( float( x ), float( y ), float( z ) );
				vec3 r = o + nbGrad( i + o ) * 0.5 + 0.5 - f;
				best = min( best, dot( r, r ) );
			}
		}
	}
	return sqrt( best );
}
`;
