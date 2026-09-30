export const SHADE_FRAG = `
precision highp float;
precision highp int;
precision highp sampler3D;

#define HORIZON 1.0
#define ISCO 3.0
#define TAU 6.28318530718
#define PI_CONST 3.14159265359
#define DISK_GAIN 1.35
#define AA_TAPS 6
#define AA_SPAN_MIN 0.15
#define FIELD_MEAN 0.52
#define SHEAR_REF_RADIUS 6.5
#define SHEAR_PERIOD 10.0

#define LOOK_STRETCH 5.75
#define LOOK_DETAIL 3.44
#define LOOK_TURBULENCE 4.46
#define LOOK_DENSITY 1.38
#define LOOK_CLOUD_SCALE 20.0
#define LOOK_CLOUD_SPEED 0.3
#define LOOK_CLOUD_STRENGTH 0.2
#define LOOK_ARC_LIFT 0.43
#define LOOK_SWIRL -0.25
#define LOOK_CONTRAST -0.67
#define LOOK_FRAY 0.69

uniform sampler2D gHit1;
uniform sampler2D gHit2;
uniform sampler2D gSky;
uniform sampler2D gView;
uniform sampler2D gAa;
uniform sampler2D gAaGeom;
uniform sampler3D uNoise;
uniform float uTime;
uniform float uYaw;
uniform float uDiskOuter;
uniform float uBrightness;
uniform float uSpeed;
uniform float uDoppler;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uHot;

layout( location = 0 ) out vec4 oColor;

struct Sample {
    vec3 position;
    vec2 diskUv;
    vec2 diskPolar;
    vec3 viewDirection;
    float side;
    float coverage;
    float span;
    bool isHit;
};

struct DiskSample {
    vec3 color;
    float alpha;
};

vec3 decodeDirection( vec2 encoded ) {
    float horizontal = sqrt( max( 1.0 - encoded.x * encoded.x, 0.0 ) );
    return vec3( cos( encoded.y ) * horizontal, encoded.x, sin( encoded.y ) * horizontal );
}

Sample decodeLayer( vec2 plane, vec2 encodedDirection, vec2 aa ) {
    Sample g;
    float planeRadius = length( plane );
    bool isHit = planeRadius > ISCO * 0.5;
    float radius = max( planeRadius, ISCO );
    float azimuth = atan( plane.y, plane.x );
    vec3 direction = decodeDirection( encodedDirection );
    float side = direction.y > 0.0 ? -1.0 : 1.0;
    g.position = isHit ? vec3( plane.x, 0.0, plane.y ) : vec3( 0.0 );
    g.diskUv = vec2( clamp( ( radius - ISCO ) / max( uDiskOuter - ISCO, 0.001 ), 0.0, 1.0 ), ( azimuth + PI_CONST ) / TAU );
    g.diskPolar = vec2( radius, azimuth );
    g.viewDirection = direction;
    g.side = isHit ? side : 0.0;
    g.coverage = clamp( aa.x, 0.0, 1.0 );
    g.span = clamp( aa.y, 0.0, 1.0 );
    g.isHit = isHit;
    return g;
}

Sample atRadius( Sample g, float radius ) {
    Sample moved = g;
    float clamped = clamp( radius, ISCO, max( uDiskOuter, ISCO ) );
    float azimuth = g.diskPolar.y;
    moved.position = vec3( cos( azimuth ) * clamped, 0.0, sin( azimuth ) * clamped );
    moved.diskPolar = vec2( clamped, azimuth );
    moved.diskUv = vec2( clamp( ( clamped - ISCO ) / max( uDiskOuter - ISCO, 0.001 ), 0.0, 1.0 ), g.diskUv.y );
    return moved;
}

vec3 rotateY( vec3 v, float angle ) {
    float c = cos( angle );
    float s = sin( angle );
    return vec3( c * v.x + s * v.z, v.y, -s * v.x + c * v.z );
}

float wrapAngle( float angle ) {
    return angle - TAU * floor( ( angle + PI_CONST ) / TAU );
}

Sample rotateSample( Sample g, float angle ) {
    Sample r = g;
    r.position = rotateY( g.position, angle );
    r.viewDirection = rotateY( g.viewDirection, angle );
    float azimuth = wrapAngle( g.diskPolar.y - angle );
    r.diskPolar = vec2( g.diskPolar.x, azimuth );
    r.diskUv = vec2( g.diskUv.x, ( azimuth + PI_CONST ) / TAU );
    return r;
}

float noise3( vec3 p ) {
    vec3 i = floor( p );
    vec3 f = p - i;
    vec3 u = f * f * ( 3.0 - 2.0 * f );
    float invSize = 1.0 / float( textureSize( uNoise, 0 ).x );
    return textureLod( uNoise, ( i + u + 0.5 ) * invSize, 0.0 ).r;
}

float streakFbm( float angle, float radius, float angScale, float radScale, int octaves, float dAngle, float dRadius, float lacAng, float lacRad, float seed ) {
    float value = 0.0;
    float total = 0.0;
    float amplitude = 0.5;
    float a = angScale;
    float r = radScale;
    float offset = seed;
    for ( int i = 0; i < octaves; i++ ) {
        float visible = clamp( 1.0 - 1.7 * max( dAngle * a, dRadius * r ), 0.0, 1.0 );
        float sampleValue = 0.5;
        if ( visible > 0.004 ) {
            sampleValue = mix( 0.5, noise3( vec3( cos( angle ) * a, sin( angle ) * a, radius * r + offset ) ), visible );
        }
        value += amplitude * sampleValue;
        total += amplitude;
        a *= lacAng;
        r *= lacRad;
        offset += 23.7;
        amplitude *= 0.55;
    }
    return value / max( total, 0.0001 );
}

float ridgeFbm( float angle, float radius, float angScale, float radScale, int octaves, float dAngle, float dRadius, float lacAng, float lacRad, float seed ) {
    float value = 0.0;
    float total = 0.0;
    float amplitude = 0.5;
    float a = angScale;
    float r = radScale;
    float offset = seed;
    for ( int i = 0; i < octaves; i++ ) {
        float visible = clamp( 1.0 - 1.7 * max( dAngle * a, dRadius * r ), 0.0, 1.0 );
        float crest = 0.42;
        if ( visible > 0.004 ) {
            float n = noise3( vec3( cos( angle ) * a, sin( angle ) * a, radius * r + offset ) );
            crest = mix( 0.42, pow( 1.0 - abs( n * 2.0 - 1.0 ), 1.35 ), visible );
        }
        value += amplitude * crest;
        total += amplitude;
        a *= lacAng;
        r *= lacRad;
        offset += 41.9;
        amplitude *= 0.62;
    }
    return value / max( total, 0.0001 );
}

vec2 smokeField( float angle, float radius, float angBase, float radBase, float flowRad, float chaos, float outward, float dAngle, float dRadius ) {
    float warpA = streakFbm( angle, radius, angBase * 0.55, flowRad * 1.6, 2, dAngle, dRadius, 1.6, 2.0, 3.7 ) - 0.5;
    float warpB = streakFbm( angle + 2.4, radius * 1.13, angBase * 2.8, radBase * 0.45, 3, dAngle, dRadius, 1.7, 2.0, 61.3 ) - 0.5;
    float radiusW = radius + ( warpA * 1.9 + warpB * 1.25 * outward ) * chaos;
    float angleW = angle + ( warpB * 0.9 - warpA * 0.35 ) * chaos * 0.55 / max( radius * 0.22, 0.35 );
    float flow = streakFbm( angleW, radiusW, angBase, flowRad, 3, dAngle, dRadius, 2.0, 1.12, 131.7 );
    float threads = ridgeFbm( angleW, radiusW, angBase * 0.85, radBase, 5, dAngle, dRadius, 1.26, 2.05, 0.0 );
    float fineVis = clamp( 1.0 - 1.7 * max( dAngle * angBase * 0.85, dRadius * radBase ), 0.0, 1.0 );
    float field = mix( flow, flow * 0.22 + threads * 1.05, fineVis );
    return vec2( field, ( warpA + warpB * 0.5 ) * 0.9 );
}

DiskSample shadeDisk( Sample g, float footprint ) {
    vec2 plane = g.position.xz;
    float radius = g.diskPolar.x;
    float azimuth = g.diskPolar.y;
    float radiusNorm = clamp( g.diskUv.x, 0.0, 1.0 );
    vec3 viewDirection = g.viewDirection;

    float slant = max( abs( viewDirection.y ), 0.022 );
    float grazing = min( 1.0 / slant, 34.0 );
    vec2 viewPlane = normalize( viewDirection.xz + vec2( 1e-6, 0.0 ) );
    vec2 radialDir = normalize( plane + vec2( 1e-6, 0.0 ) );
    float alignR = clamp( abs( dot( radialDir, viewPlane ) ), 0.0, 1.0 );
    float alignT = sqrt( max( 1.0 - alignR * alignR, 0.0 ) );
    float stretchSq = grazing * grazing - 1.0;
    float kR = sqrt( 1.0 + stretchSq * alignR * alignR );
    float kT = sqrt( 1.0 + stretchSq * alignT * alignT );
    float pixelWorld = footprint / max( LOOK_DETAIL * kR, LOOK_STRETCH * kT / max( radius, ISCO ) );
    float dRadius = pixelWorld * kR;
    float dAngle = pixelWorld * kT / max( radius, ISCO );

    float omega = uSpeed * 0.55 / pow( radius, 1.5 );
    float omegaRef = uSpeed * 0.55 / pow( SHEAR_REF_RADIUS, 1.5 );
    float dOmega = omega - omegaRef;
    float rigid = fract( uTime * omegaRef / TAU ) * TAU;
    float swirl = max( 0.0, 0.85 + LOOK_SWIRL );
    float flowBase = azimuth - rigid + swirl * log( radius / ISCO );

    float cycle = uTime / SHEAR_PERIOD;
    float u0 = fract( cycle );
    float u1 = fract( cycle + 0.5 );
    float w0 = 1.0 - abs( 2.0 * u0 - 1.0 );
    float w1 = 1.0 - w0;
    float angle0 = flowBase - dOmega * ( u0 - 0.5 ) * SHEAR_PERIOD;
    float angle1 = flowBase - dOmega * ( u1 - 0.5 ) * SHEAR_PERIOD;

    float outward = smoothstep( 0.0, 0.92, radiusNorm );
    float fray = max( 0.0, 1.0 + LOOK_FRAY );
    float chaos = LOOK_TURBULENCE * ( 0.08 + 2.10 * outward * outward ) * fray;
    float angBase = LOOK_STRETCH * 0.45 * ( 0.80 + 1.45 * outward * fray );
    float radBase = LOOK_DETAIL * 2.35;
    float flowRad = LOOK_DETAIL * 0.105;

    float lobeShift = abs( dOmega ) * SHEAR_PERIOD * 0.5 * angBase * 0.85;
    float rho = 1.0 - smoothstep( 0.12, 1.1, lobeShift );
    vec2 blended;
    float lobeVariance = 1.0;
    if ( rho > 0.98 ) {
        blended = smokeField( mix( angle1, angle0, w0 ), radius, angBase, radBase, flowRad, chaos, outward, dAngle, dRadius );
    } else {
        vec2 lobe0 = smokeField( angle0, radius, angBase, radBase, flowRad, chaos, outward, dAngle, dRadius );
        vec2 lobe1 = smokeField( angle1, radius, angBase, radBase, flowRad, chaos, outward, dAngle, dRadius );
        blended = mix( lobe1, lobe0, w0 );
        lobeVariance = sqrt( max( w0 * w0 + w1 * w1 + 2.0 * rho * w0 * w1, 0.25 ) );
    }
    float field = FIELD_MEAN + ( blended.x - FIELD_MEAN ) / lobeVariance;

    float cloudRate = omegaRef * LOOK_CLOUD_SPEED;
    float cloudRigid = fract( uTime * cloudRate / TAU ) * TAU;
    float cloudAngle = azimuth - cloudRigid + 0.32 * log( radius / ISCO );
    float cloudRaw = streakFbm( cloudAngle, radius, LOOK_CLOUD_SCALE, LOOK_CLOUD_SCALE * 0.34, 2, dAngle, dRadius, 1.72, 1.86, 211.7 );
    float cloud = smoothstep( 0.28, 0.72, cloudRaw );
    field *= mix( 1.0 - LOOK_CLOUD_STRENGTH, 1.0 + LOOK_CLOUD_STRENGTH, cloud );

    float innerEdge = smoothstep( 0.0, 0.055, radiusNorm );
    float outerEdge = 1.0 - smoothstep( 0.42 + blended.y * 0.30 * fray, 1.0, radiusNorm );
    float envelope = innerEdge * outerEdge * mix( 1.0, 0.62, outward );

    float contrast = max( 0.2, 1.0 + LOOK_CONTRAST );
    float lo = 0.50 - 0.16 / contrast;
    float hi = 0.50 + 0.21 / contrast;
    float smoke = clamp( pow( smoothstep( lo, hi, field ), 1.0 + 0.9 * contrast ) * envelope, 0.0, 1.0 );
    float fieldN = clamp( ( field - ( lo - 0.10 ) ) / max( hi - lo + 0.26, 0.02 ), 0.0, 1.0 );
    float emissivity = ( mix( 0.05, 1.0, pow( fieldN, 1.35 ) ) + 2.2 * pow( fieldN, 5.0 ) ) * envelope;

    float opticalDepth = smoke * mix( 0.30, 0.85, radiusNorm ) * pow( grazing, 0.62 ) * LOOK_DENSITY * 0.95;
    float coverage = 1.0 - exp( -opticalDepth );

    float heat = pow( 1.0 - radiusNorm, 1.25 );
    vec3 thermal = mix( uDeep, uMid, smoothstep( 0.03, 0.5, heat ) );
    thermal = mix( thermal, uHot, pow( heat, 2.2 ) );

    vec3 tangent = normalize( vec3( -plane.y, 0.0, plane.x ) );
    float orbitalSpeed = min( 0.64, 0.94 / sqrt( max( radius - HORIZON, 0.25 ) ) );
    float towardObserver = dot( tangent, -normalize( viewDirection ) );
    float beaming = pow( clamp( 1.0 / ( 1.0 - orbitalSpeed * towardObserver ), 0.72, 1.55 ), 1.5 * uDoppler );
    float redshift = sqrt( max( 1.0 - HORIZON / radius, 0.025 ) );
    float facing = mix( 0.82, 1.0, step( 0.0, g.side ) );
    float flux = pow( clamp( ISCO / radius, 0.0, 1.0 ), 1.7 );
    float core = 1.0 + 2.6 * pow( 1.0 - radiusNorm, 5.0 );
    float faceOn = smoothstep( 0.16, 0.75, abs( viewDirection.y ) );
    float lift = 1.0 + 1.55 * max( 0.0, 1.0 + LOOK_ARC_LIFT ) * faceOn;
    float edgeGlow = 1.0 + 0.55 * smoothstep( 6.0, 26.0, grazing );

    DiskSample s;
    s.color = thermal * beaming * redshift * facing * flux * lift * edgeGlow * core * emissivity * uBrightness * 1.35;
    s.alpha = coverage;
    return s;
}

vec2 footprintAxes( Sample g ) {
    float noiseAngle = g.diskPolar.y - min( uTime, SHEAR_PERIOD * 0.5 ) * ( uSpeed * 0.55 / pow( g.diskPolar.x, 1.5 ) );
    vec3 coords = vec3( cos( noiseAngle ) * LOOK_STRETCH, sin( noiseAngle ) * LOOK_STRETCH, g.diskPolar.x * LOOK_DETAIL );
    return vec2( max( fwidth( coords.x ), fwidth( coords.y ) ), fwidth( coords.z ) );
}

float footprintOf( vec2 axes ) {
    return min( max( axes.x, axes.y ), 4.0 );
}

DiskSample shadeFront( Sample g, float footprint, float angularFootprint ) {
    float annulus = max( uDiskOuter - ISCO, 0.001 );
    float spanWorld = g.span * annulus;
    if ( g.span <= AA_SPAN_MIN ) return shadeDisk( g, footprint );
    float tapFootprint = min( max( angularFootprint, LOOK_DETAIL * ( spanWorld / float( AA_TAPS ) ) ), 4.0 );
    float stepSize = spanWorld / float( AA_TAPS );
    float start = g.diskPolar.x - spanWorld * 0.5;
    vec3 sumEmission = vec3( 0.0 );
    float sumAlpha = 0.0;
    float taps = 0.0;
    for ( int i = 0; i < AA_TAPS; i++ ) {
        float radius = start + ( float( i ) + 0.5 ) * stepSize;
        if ( radius < ISCO || radius > uDiskOuter ) continue;
        DiskSample tap = shadeDisk( atRadius( g, radius ), tapFootprint );
        sumEmission += tap.color * tap.alpha;
        sumAlpha += tap.alpha;
        taps += 1.0;
    }
    if ( taps < 0.5 ) return shadeDisk( g, footprint );
    DiskSample s;
    float meanAlpha = sumAlpha / taps;
    s.alpha = meanAlpha;
    s.color = meanAlpha > 1e-6 ? ( sumEmission / taps ) / meanAlpha : vec3( 0.0 );
    return s;
}

void main() {
    ivec2 texel = ivec2( gl_FragCoord.xy );
    vec2 hit1 = texelFetch( gHit1, texel, 0 ).xy;
    vec2 hit2 = texelFetch( gHit2, texel, 0 ).xy;
    vec4 view = texelFetch( gView, texel, 0 );
    vec2 aa = texelFetch( gAa, texel, 0 ).xy;
    vec4 aaGeom = texelFetch( gAaGeom, texel, 0 );

    bool substitute = length( hit1 ) <= ISCO * 0.5 && length( aaGeom.xy ) > ISCO * 0.5;
    Sample front = decodeLayer( substitute ? aaGeom.xy : hit1, substitute ? aaGeom.zw : view.xy, aa );
    Sample back = decodeLayer( hit2, view.zw, vec2( 1.0, 0.0 ) );
    if ( ! front.isHit ) back.isHit = false;

    vec2 frontAxes = footprintAxes( front );
    float frontFootprint = footprintOf( frontAxes );
    float backFootprint = footprintOf( footprintAxes( back ) );

    front = rotateSample( front, -uYaw );
    back = rotateSample( back, -uYaw );

    vec3 color = vec3( 0.0 );
    float transmit = 1.0;
    if ( back.isHit ) {
        DiskSample b = shadeDisk( back, backFootprint );
        color = b.color * b.alpha * DISK_GAIN;
        transmit = 1.0 - b.alpha;
    }
    if ( front.isHit ) {
        DiskSample f = shadeFront( front, frontFootprint, frontAxes.x );
        f.alpha *= front.coverage;
        color = f.color * f.alpha * DISK_GAIN + color * ( 1.0 - f.alpha );
        transmit *= 1.0 - f.alpha;
    }
    oColor = vec4( color, 1.0 - transmit );
}
`;
