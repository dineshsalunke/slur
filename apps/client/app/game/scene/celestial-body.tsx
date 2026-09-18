import { useMemo } from 'react';
import * as THREE from 'three';
import { type SkyConfig, starDirection } from './sky-config';

// The body is camera-locked but not un-rotated, so unlike the dome it cannot reuse object-space position as a
// direction — it needs a real normal and a real view vector.
const VERTEX_SHADER = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;

void main() {
    vec4 worldPos = modelMatrix * vec4( position, 1.0 );
    vNormal = normalize( mat3( modelMatrix ) * normal );
    vView = normalize( cameraPosition - worldPos.xyz );
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;

uniform vec3 uStarDir;
uniform vec3 uLit;
uniform vec3 uShadow;
uniform vec3 uRim;
uniform float uTerminator;
uniform float uRimPower;
uniform float uRimStrength;
uniform float uDetail;
uniform float uDetailScale;
uniform float uGain;

// Same hash/value-noise pair as the dome. Duplicated rather than shared: GLSL has no module system, and the
// alternative is a string-concatenation chunk registry, which buys nothing at two call sites.
float hash( vec3 p ) {
    p = fract( p * 0.3183099 + vec3( 0.71, 0.113, 0.419 ) );
    p *= 17.0;
    return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}

float vnoise( vec3 x ) {
    vec3 i = floor( x );
    vec3 f = fract( x );
    f = f * f * ( 3.0 - 2.0 * f );
    return mix(
        mix(
            mix( hash( i + vec3( 0.0, 0.0, 0.0 ) ), hash( i + vec3( 1.0, 0.0, 0.0 ) ), f.x ),
            mix( hash( i + vec3( 0.0, 1.0, 0.0 ) ), hash( i + vec3( 1.0, 1.0, 0.0 ) ), f.x ),
            f.y ),
        mix(
            mix( hash( i + vec3( 0.0, 0.0, 1.0 ) ), hash( i + vec3( 1.0, 0.0, 1.0 ) ), f.x ),
            mix( hash( i + vec3( 0.0, 1.0, 1.0 ) ), hash( i + vec3( 1.0, 1.0, 1.0 ) ), f.x ),
            f.y ),
        f.z );
}

float fbm( vec3 p ) {
    float amp = 0.5;
    float sum = 0.0;
    float norm = 0.0;
    for ( int i = 0; i < DETAIL_OCTAVES; i ++ ) {
        sum += amp * vnoise( p );
        norm += amp;
        p *= 2.03;
        amp *= 0.5;
    }
    return sum / norm;
}

void main() {
    vec3 N = normalize( vNormal );
    vec3 V = normalize( vView );

    // A SOFT terminator band, never a hard clip: the look target's day/night boundary is a gradient several
    // degrees wide, and a clipped one reads as a pasted-on circle.
    float lambert = dot( N, uStarDir );
    float day = smoothstep( -uTerminator, uTerminator, lambert );

    // Surface mottle, across the WHOLE body rather than the lit side only.
    //
    // Restricting it to the lit side was wrong in practice: at this composition most of the disc facing the
    // camera is night, so the body rendered as a flat dark circle with a rim and no surface at all. A real
    // night side is not featureless — it carries the same terrain, just barely lit — so the shadow stop has
    // to be modulated too, and kept a little above the sky behind it or there is nothing for the mottle to
    // vary. Two frequencies: a broad one for continent-scale blotching, a fine one for the grain over it.
    // The smoothstep is NOT cosmetic. Normalised value-noise piles up around 0.5 — measured on the dome's
    // own field, p25 to p75 spans barely 0.1 — so feeding fbm straight in gives a ~13% swing that is
    // invisible on a surface this dark. Stretching the middle of the distribution to the full 0-1 range is
    // what turns it into terrain rather than a faint haze.
    float broad = smoothstep( 0.35, 0.65, fbm( N * uDetailScale ) );
    float fine = fbm( N * uDetailScale * 3.7 + vec3( 19.3, 7.1, 41.9 ) );
    float mottle = mix( 1.0, 0.35 + 1.3 * broad + 0.35 * ( fine - 0.5 ), uDetail );
    vec3 col = mix( uShadow, uLit, day ) * mottle;

    // The fresnel rim is LOAD-BEARING, not decoration: a physically-correct diffuse night side is simply
    // dark, so the bright crescent visible on boards 05/12/13 and on nebula-backdrop.jpg has to be an added
    // term. Gated by "day" so it fires only along the LIT limb — ungated it closes into a full halo, which
    // reads as atmosphere on a body that has none.
    float fresnel = pow( 1.0 - max( dot( N, V ), 0.0 ), uRimPower );
    col += uRim * fresnel * uRimStrength * day;

    gl_FragColor = vec4( col * uGain, 1.0 );

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

/**
 * How far out the body sits. NOT an art knob — apparent size is, and it is authored in degrees.
 *
 * The one real constraint is ordering: the body is opaque and writes depth, so anything BEHIND it is
 * correctly occluded, but drei's `<Stars>` draws in the transparent pass and would paint points over a body
 * that sat further out than the star shell. Landing inside the shell's inner edge (`radius - depth`) makes
 * "no stars in front of the planet" a property of the geometry rather than a render-order convention.
 */
function bodyDistance( config: SkyConfig ): number {
    return Math.min( config.stars.radius - config.stars.depth, config.radius ) * 0.7;
}

const DEGREES_PER_RADIAN = 180 / Math.PI;

/**
 * The rim-lit celestial body — board 12's upper-right planet limb, and the source of the bright tail the
 * nebula is deliberately holding short.
 *
 * It reads the SAME `starBearingDeg` / `starElevationDeg` the dome's cloud lighting and `StarLight` read, so
 * the body, the light and the background cannot disagree about where the light is. Its own position is a
 * separate bearing on purpose: a body sitting exactly ON the star bearing shows a fully-lit face, and the
 * crescent only appears once the two are far enough apart to put the near hemisphere in shadow.
 */
export function CelestialBody( { config, gain = 1 }: { config: SkyConfig; gain?: number } ) {
    const body = config.body;
    const distance = bodyDistance( config );
    const radius = distance * Math.tan( body.angularSizeDeg / 2 / DEGREES_PER_RADIAN );
    const [ x, y, z ] = starDirection( body.bearingDeg, body.elevationDeg );

    const uniforms = useMemo(
        () => ( {
            uStarDir: {
                value: new THREE.Vector3( ...starDirection( config.starBearingDeg, config.starElevationDeg ) ),
            },
            uLit: { value: new THREE.Color( body.litColor ) },
            uShadow: { value: new THREE.Color( body.shadowColor ) },
            uRim: { value: new THREE.Color( body.rimColor ) },
            uTerminator: { value: body.terminatorSoftness },
            uRimPower: { value: body.rimPower },
            uRimStrength: { value: body.rimStrength },
            uDetail: { value: body.detail },
            uDetailScale: { value: body.detailScale },
            uGain: { value: gain },
        } ),
        [ config, body, gain ],
    );

    return (
        <mesh position={ [ x * distance, y * distance, z * distance ] } scale={ radius }>
            { /* Dense enough that the limb is a smooth arc: the silhouette IS the subject here, and a faceted
                 edge is the one artefact a rim term makes impossible to hide. */ }
            <sphereGeometry args={ [ 1, 96, 48 ] } />
            { /* `key` on the shader's own length: three caches the compiled PROGRAM, so editing the shader
                 source under HMR silently keeps rendering the old one — an edit appears to do nothing, which
                 cost three round-trips of "why did that change nothing" before it was spotted. Keying on the
                 source makes a text edit produce a fresh material. Same trick the dome uses for its OCTAVES
                 #define, for the same reason. */ }
            <shaderMaterial
                key={ FRAGMENT_SHADER.length }
                vertexShader={ VERTEX_SHADER }
                fragmentShader={ FRAGMENT_SHADER }
                uniforms={ uniforms }
                defines={ { DETAIL_OCTAVES: 4 } }
                toneMapped={ false }
            />
        </mesh>
    );
}
