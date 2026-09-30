export const FULLSCREEN_VERT = `
precision highp float;
in vec3 position;
void main() {
    gl_Position = vec4( position.xy, 0.0, 1.0 );
}
`;

const GEODESIC = `
precision highp float;
precision highp int;

#define HORIZON 1.0
#define ISCO 3.0
#define MAX_STEPS 768

uniform vec2 uResolution;
uniform float uPitch;
uniform float uRoll;
uniform float uOrbit;
uniform float uFov;
uniform float uDiskOuter;

struct Trace {
    vec2 hit1Plane;
    vec2 hit1Direction;
    vec2 hit2Plane;
    vec2 hit2Direction;
    int hitCount;
    float swallowed;
    float escaped;
    vec3 finalVelocity;
};

float escapeRadius() {
    return max( 120.0, uOrbit + 8.0 );
}

vec2 encodeDirection( vec3 d ) {
    return vec2( d.y, atan( d.z, d.x ) );
}

vec3 geodesicAcceleration( vec3 p, vec3 v ) {
    float r2 = max( dot( p, p ), 0.0001 );
    vec3 l = cross( p, v );
    return -1.5 * dot( l, l ) * p / ( r2 * r2 * sqrt( r2 ) );
}

void cameraBasis( out vec3 origin, out vec3 forward, out vec3 right, out vec3 up ) {
    float pitch = clamp( uPitch, -1.319, 1.319 );
    origin = vec3( 0.0, sin( pitch ) * uOrbit, cos( pitch ) * uOrbit );
    forward = normalize( -origin );
    right = normalize( cross( forward, vec3( 0.0, 1.0, 0.0 ) ) );
    up = cross( right, forward );
}

vec3 cameraDirection( vec2 ndc ) {
    vec3 origin;
    vec3 forward;
    vec3 right;
    vec3 up;
    cameraBasis( origin, forward, right, up );
    float c = cos( uRoll );
    float s = sin( uRoll );
    vec2 screen = vec2( ndc.x * c - ndc.y * s, ndc.x * s + ndc.y * c );
    return normalize( forward * uFov + right * screen.x + up * screen.y );
}

vec3 cameraOrigin() {
    vec3 origin;
    vec3 forward;
    vec3 right;
    vec3 up;
    cameraBasis( origin, forward, right, up );
    return origin;
}

Trace traceRay( vec3 start, vec3 initialVelocity ) {
    vec3 position = start;
    vec3 velocity = initialVelocity;
    float escape = escapeRadius();
    Trace t;
    t.hit1Plane = vec2( 0.0 );
    t.hit1Direction = vec2( 0.0 );
    t.hit2Plane = vec2( 0.0 );
    t.hit2Direction = vec2( 0.0 );
    t.hitCount = 0;
    t.swallowed = 0.0;
    t.escaped = 0.0;
    for ( int i = 0; i < MAX_STEPS; i++ ) {
        float radius = length( position );
        if ( radius < HORIZON * 1.004 ) {
            t.swallowed = 1.0;
            break;
        }
        if ( radius > escape && dot( position, velocity ) > 0.0 ) {
            t.escaped = 1.0;
            break;
        }
        float stepSize = clamp( ( radius - HORIZON ) * 0.035, 0.0045, 0.075 * max( 1.0, radius / 6.0 ) );
        vec3 previousPosition = position;
        vec3 previousVelocity = velocity;
        velocity += geodesicAcceleration( position, velocity ) * ( 0.5 * stepSize );
        position += velocity * stepSize;
        velocity += geodesicAcceleration( position, velocity ) * ( 0.5 * stepSize );
        velocity = normalize( velocity );
        if ( t.hitCount < 2 ) {
            float previousSide = previousPosition.y >= 0.0 ? 1.0 : -1.0;
            float currentSide = position.y >= 0.0 ? 1.0 : -1.0;
            if ( previousSide != currentSide ) {
                float k = clamp( previousPosition.y / ( previousPosition.y - position.y ), 0.0, 1.0 );
                vec3 crossing = mix( previousPosition, position, k );
                float planeRadius = length( crossing.xz );
                if ( planeRadius >= ISCO && planeRadius <= uDiskOuter ) {
                    vec2 direction = encodeDirection( normalize( mix( previousVelocity, velocity, k ) ) );
                    if ( t.hitCount == 0 ) {
                        t.hit1Plane = crossing.xz;
                        t.hit1Direction = direction;
                    } else {
                        t.hit2Plane = crossing.xz;
                        t.hit2Direction = direction;
                    }
                    t.hitCount += 1;
                }
            }
        }
    }
    t.finalVelocity = velocity;
    return t;
}
`;

export const BAKE_FRAG = `${ GEODESIC }
layout( location = 0 ) out vec4 oHit1;
layout( location = 1 ) out vec4 oHit2;
layout( location = 2 ) out vec4 oSky;
layout( location = 3 ) out vec4 oView;

void main() {
    vec2 ndc = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
    Trace t = traceRay( cameraOrigin(), cameraDirection( ndc ) );
    if ( t.swallowed < 0.5 && t.escaped < 0.5 ) t.swallowed = 1.0;
    oHit1 = vec4( t.hit1Plane, 0.0, 1.0 );
    oHit2 = vec4( t.hit2Plane, 0.0, 1.0 );
    oSky = vec4( t.finalVelocity, t.swallowed + t.escaped * 2.0 );
    oView = vec4( t.hit1Direction, t.hit2Direction );
}
`;

export const REFINE_FRAG = `${ GEODESIC }
#define SUB_STEPS 4
#define MASK_RADIUS 2
#define GRADIENT_LIMIT 0.12
#define B_CRIT 2.59807621
#define CRITICAL_BAND 0.06

uniform sampler2D gHit1;
uniform sampler2D gSky;

layout( location = 0 ) out vec4 oCoverage;
layout( location = 1 ) out vec4 oGeometry;

bool isHitAt( vec2 plane ) {
    return length( plane ) > ISCO * 0.5;
}

bool isHoleAt( ivec2 texel ) {
    return ( int( texelFetch( gSky, texel, 0 ).w + 0.5 ) & 1 ) != 0;
}

void main() {
    ivec2 dimensions = textureSize( gHit1, 0 );
    ivec2 texel = ivec2( gl_FragCoord.xy );
    float annulus = max( uDiskOuter - ISCO, 0.001 );

    vec2 centerPlane = texelFetch( gHit1, texel, 0 ).xy;
    bool centerHit = isHitAt( centerPlane );
    bool centerHole = isHoleAt( texel );
    float centerRadiusNorm = clamp( ( length( centerPlane ) - ISCO ) / annulus, 0.0, 1.0 );

    vec2 ndc = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
    vec3 origin = cameraOrigin();
    float impact = length( cross( origin, cameraDirection( ndc ) ) );

    bool boundary = abs( impact - B_CRIT ) < CRITICAL_BAND * HORIZON;
    for ( int dy = -MASK_RADIUS; dy <= MASK_RADIUS; dy++ ) {
        for ( int dx = -MASK_RADIUS; dx <= MASK_RADIUS; dx++ ) {
            ivec2 neighbor = clamp( texel + ivec2( dx, dy ), ivec2( 0 ), dimensions - ivec2( 1 ) );
            vec2 plane = texelFetch( gHit1, neighbor, 0 ).xy;
            bool hit = isHitAt( plane );
            bool hole = isHoleAt( neighbor );
            if ( hit != centerHit || hole != centerHole ) boundary = true;
            if ( hit && centerHit ) {
                float radiusNorm = clamp( ( length( plane ) - ISCO ) / annulus, 0.0, 1.0 );
                if ( abs( radiusNorm - centerRadiusNorm ) > GRADIENT_LIMIT ) boundary = true;
            }
        }
    }

    if ( ! boundary ) {
        oCoverage = vec4( centerHit ? 1.0 : 0.0, 0.0, 0.0, 1.0 );
        oGeometry = vec4( 0.0 );
        return;
    }

    float hits = 0.0;
    float minRadius = 1e9;
    float maxRadius = -1e9;
    vec2 bestPlane = vec2( 0.0 );
    vec2 bestDirection = vec2( 0.0 );
    float bestRadius = 0.0;
    float bestDistance = 1e9;
    for ( int sy = 0; sy < SUB_STEPS; sy++ ) {
        for ( int sx = 0; sx < SUB_STEPS; sx++ ) {
            vec2 offset = ( vec2( float( sx ), float( sy ) ) + 0.5 ) / float( SUB_STEPS );
            vec2 subNdc = ( vec2( texel ) + offset ) / uResolution * 2.0 - 1.0;
            Trace t = traceRay( origin, cameraDirection( subNdc ) );
            if ( t.hitCount > 0 ) {
                float radius = length( t.hit1Plane );
                hits += 1.0;
                minRadius = min( minRadius, radius );
                maxRadius = max( maxRadius, radius );
                float distance = length( offset - vec2( 0.5 ) );
                if ( distance < bestDistance ) {
                    bestDistance = distance;
                    bestPlane = t.hit1Plane;
                    bestDirection = t.hit1Direction;
                    bestRadius = radius;
                }
            }
        }
    }

    if ( hits < 0.5 ) {
        oCoverage = vec4( 0.0, 0.0, 0.0, 1.0 );
        oGeometry = vec4( 0.0 );
        return;
    }

    float coverage = hits / float( SUB_STEPS * SUB_STEPS );
    float r0 = length( centerPlane );
    float span = 0.0;
    vec4 geometry = vec4( 0.0 );
    if ( centerHit ) {
        span = 2.0 * max( abs( maxRadius - r0 ), abs( r0 - minRadius ) );
    } else {
        r0 = 0.5 * ( minRadius + maxRadius );
        span = maxRadius - minRadius;
        geometry = vec4( bestPlane * ( r0 / max( bestRadius, ISCO ) ), bestDirection );
    }
    oCoverage = vec4( coverage, clamp( span / annulus, 0.0, 1.0 ), 0.0, 1.0 );
    oGeometry = geometry;
}
`;

export const LENS_FRAG = `${ GEODESIC }
#define MAX_OFFSET 3.0

uniform sampler2D gSky;

layout( location = 0 ) out vec4 oLens;

void main() {
    ivec2 texel = ivec2( gl_FragCoord.xy );
    vec4 sky = texelFetch( gSky, texel, 0 );
    bool hole = ( int( sky.w + 0.5 ) & 1 ) != 0;
    vec2 ndc = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
    vec3 origin;
    vec3 forward;
    vec3 right;
    vec3 up;
    cameraBasis( origin, forward, right, up );
    vec3 d = normalize( sky.xyz );
    float ahead = max( dot( d, forward ), 0.05 );
    vec2 screen = uFov * vec2( dot( d, right ), dot( d, up ) ) / ahead;
    float c = cos( uRoll );
    float s = sin( uRoll );
    vec2 seen = vec2( screen.x * c + screen.y * s, -screen.x * s + screen.y * c );
    vec2 offset = hole ? vec2( 0.0 ) : seen - ndc;
    float len = length( offset );
    if ( len > MAX_OFFSET ) offset *= MAX_OFFSET / len;
    oLens = vec4( offset, hole ? 1.0 : 0.0, 1.0 );
}
`;
