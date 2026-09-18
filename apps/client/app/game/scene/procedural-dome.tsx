import { type Ref, useMemo } from 'react';
import * as THREE from 'three';
import { nebulaFrequency, type SkyConfig, starDirection } from './sky-config';

// The dome is an un-rotated, camera-locked sphere, so object-space position IS the world view direction.
// Interpolated, then normalised in the fragment shader — normalising here would leave vDir non-unit after
// interpolation and bend the gradient between vertices.
const VERTEX_SHADER = /* glsl */ `
varying vec3 vDir;

void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying vec3 vDir;

uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uNadir;
uniform vec3 uRamp0;
uniform vec3 uRamp1;
uniform vec3 uRamp2;
uniform float uFrequency;
uniform float uWarp;
uniform float uRidge;
uniform float uThreshold;
uniform float uSoftness;
uniform float uOpacity;
uniform float uGain;
uniform float uMaskFrequency;
uniform float uMaskThreshold;
uniform float uMaskSoftness;
uniform float uDustFrequency;
uniform float uDustThreshold;
uniform float uDustSoftness;
uniform float uDustStrength;
uniform vec3 uStarDir;
uniform float uLightContrast;
uniform float uCoreOnset;

// The sky is cosmetic and never enters simulate(), so the trig-free/no-transcendentals rules that shaped
// packages/shared/src/sim/noise.ts do not bind here.
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

// GLSL ES 1.00 requires a constant loop bound, so every octave count is a #define and each layer needs its own
// function body rather than an "oct" argument. Only OCTAVES is an art knob; the support counts are structural.
float fbm( vec3 p ) {
    float amp = 0.5;
    float sum = 0.0;
    float norm = 0.0;
    for ( int i = 0; i < OCTAVES; i ++ ) {
        sum += amp * vnoise( p );
        norm += amp;
        p *= 2.03;
        amp *= 0.5;
    }
    return sum / norm;
}

// The warp lookups only supply a flow offset, which the outer fBm then smooths — so detail here is spent for
// nothing. Measured over 40k directions, dropping these from 6 octaves to 2 moves the final field by <0.002 at
// every percentile (p50 0.536→0.537, p99 0.862→0.861) while removing ~55% of the shader's hash evaluations.
// That saving is what pays for the mask and dust layers below.
float fbmWarp( vec3 p ) {
    float amp = 0.5;
    float sum = 0.0;
    float norm = 0.0;
    for ( int i = 0; i < WARP_OCTAVES; i ++ ) {
        sum += amp * vnoise( p );
        norm += amp;
        p *= 2.03;
        amp *= 0.5;
    }
    return sum / norm;
}

float fbmMask( vec3 p ) {
    float amp = 0.5;
    float sum = 0.0;
    float norm = 0.0;
    for ( int i = 0; i < MASK_OCTAVES; i ++ ) {
        sum += amp * vnoise( p );
        norm += amp;
        p *= 2.03;
        amp *= 0.5;
    }
    return sum / norm;
}

float fbmDust( vec3 p ) {
    float amp = 0.5;
    float sum = 0.0;
    float norm = 0.0;
    for ( int i = 0; i < DUST_OCTAVES; i ++ ) {
        sum += amp * vnoise( p );
        norm += amp;
        p *= 2.03;
        amp *= 0.5;
    }
    return sum / norm;
}

// Ridged multifractal: folding the noise about its midpoint turns smooth hills into sharp creases, which is
// what makes a nebula read as bright FILAMENTS on dark cloud rather than as blobs lit at their cores.
// Squared to thin the ridges; the unsquared fold leaves them too fat to read as strands.
float ridge( float n ) {
    float r = 1.0 - abs( 2.0 * n - 1.0 );
    return r * r;
}

float ridgedFbm( vec3 p ) {
    float amp = 0.5;
    float sum = 0.0;
    float norm = 0.0;
    for ( int i = 0; i < OCTAVES; i ++ ) {
        sum += amp * ridge( vnoise( p ) );
        norm += amp;
        p *= 2.03;
        amp *= 0.5;
    }
    return sum / norm;
}

// Quilez's domain warp: q = fBm(p), r = fBm(p + q), out = fBm(p + r). Purely a shape operation — it does
// nothing to colour, so restraint has to come from the ramp and from keeping uWarp small.
// Only the FINAL evaluation is blended toward ridged: the q/r warp lookups stay smooth, because the warp's
// job is flow and a ridged warp field just scrambles the domain.
float warpedFbm( vec3 p ) {
    vec3 q = vec3(
        fbmWarp( p ),
        fbmWarp( p + vec3( 5.2, 1.3, 2.7 ) ),
        fbmWarp( p + vec3( 1.7, 9.2, 3.1 ) ) );
    vec3 r = vec3(
        fbmWarp( p + uWarp * q ),
        fbmWarp( p + uWarp * q + vec3( 8.3, 2.8, 4.4 ) ),
        fbmWarp( p + uWarp * q + vec3( 2.9, 7.1, 6.3 ) ) );
    vec3 pw = p + uWarp * r;
    return mix( fbm( pw ), ridgedFbm( pw ), uRidge );
}

void main() {
    vec3 dir = normalize( vDir );

    vec3 base = mix( uNadir, uHorizon, smoothstep( -1.0, 0.0, dir.y ) );
    base = mix( base, uZenith, smoothstep( 0.0, 1.0, dir.y ) );

    // Four layers, each with ONE job. The slice-1 shader gave all four to a single field, which is why it could
    // not produce a composition (no scale above the base frequency) or a dark clump (brightness was a monotone
    // function of density), and read as a uniform lattice.

    // LAYER 1 — mask: WHERE there is nebula. Multiplies, so it can only carve voids, never invent cloud.
    float mask = smoothstep( uMaskThreshold, uMaskThreshold + uMaskSoftness, fbmMask( dir * uMaskFrequency ) );

    // LAYER 2 — emission: the cloud itself, indexing a hand-authored cold ramp. That ramp is the lever keeping
    // domain-warped FBM off the saturated "shadertoy nebula" reading; the same math drives both looks. The
    // threshold window has to sit on the field's real distribution or nothing renders — see sky-config.ts.
    float density = smoothstep( uThreshold, uThreshold + uSoftness, warpedFbm( dir * uFrequency ) );
    density *= mask;

    // uCoreOnset, not a hard-coded 0.5: at 0.5 a third of all cloud is already blending toward the hot top stop,
    // which collapses the >48/>80/>120 histogram bands onto each other and reads as milky haze. Hot cores have
    // to be RARE for the field to read as dark cloud with a long bright tail.
    vec3 cloud = mix( uRamp0, uRamp1, smoothstep( 0.0, uCoreOnset, density ) );
    cloud = mix( cloud, uRamp2, smoothstep( uCoreOnset, 1.0, density ) );

    // LAYER 3 — light. A hemispheric gradient about the one authored bearing. Applied to the CLOUD only: the
    // base ramp is hand-authored per elevation and should not be re-lit underneath the author.
    float lit = 0.5 + 0.5 * dot( dir, uStarDir );
    cloud *= mix( 1.0 - uLightContrast, 1.0 + uLightContrast, lit );

    vec3 col = mix( base, cloud, density * uOpacity ) * uGain;

    // LAYER 4 — dust, as extinction rather than another additive field. Multiplying the composited colour is
    // what lets a clump read as sitting IN FRONT OF the cloud; an additive dark layer would only ever darken
    // toward the base gradient and could never silhouette anything.
    // The offset decorrelates dust from the other two layers — sharing a lattice origin makes the layers align
    // near it, and dust that lands exactly on the filaments reads as a rendering fault rather than as dust.
    float dust = smoothstep(
        uDustThreshold,
        uDustThreshold + uDustSoftness,
        fbmDust( dir * uDustFrequency + vec3( 31.7, 17.3, 53.1 ) ) );
    col *= exp( - uDustStrength * dust );

    // An 8-bit framebuffer bands visibly across a near-black full-screen ramp (visible with bloom off, which
    // renders straight to the canvas). Sub-LSB hash noise breaks the bands up.
    col += ( hash( vec3( gl_FragCoord.xy, 0.0 ) ) - 0.5 ) / 255.0;

    gl_FragColor = vec4( col, 1.0 );

    // Verified in three@0.185.1: resolveIncludes runs on every material's shaders (WebGLProgram.js:790/794),
    // linearToOutputTexel is always emitted in the fragment prefix (:779), and TONE_MAPPING is only defined
    // when material.toneMapped is true (WebGLPrograms.js:176-186) — so both includes are safe here and the
    // tone-mapping one compiles to nothing under toneMapped={false}.
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

/**
 * The procedural sky dome: a cold vertical gradient with a restrained domain-warped FBM nebula over it.
 *
 * BackSide so it is seen from inside; `depthWrite={false}` so it never occludes the world; `toneMapped={false}`
 * so the authored (deliberately sub-1.0) colours reach the framebuffer literally instead of being crushed by
 * ACES — the same treatment the outgoing `GradientDome` used, for the same reason.
 *
 * `gain` is the display-vs-bake intensity split named in the binding decision: ONE generator instanced twice,
 * dim on screen and brighter inside the environment portal, so the sky you see and the sky that lights the far
 * field cannot diverge.
 */
export function ProceduralDome( {
    config,
    gain = 1,
    materialRef,
}: {
    config: SkyConfig;
    gain?: number;
    /** Escape hatch for `/iso-sky`'s tuning panel, which writes uniforms per frame. Unused by the game. */
    materialRef?: Ref< THREE.ShaderMaterial >;
} ) {
    const uniforms = useMemo(
        () => ( {
            uZenith: { value: new THREE.Color( config.gradient.zenith ) },
            uHorizon: { value: new THREE.Color( config.gradient.horizon ) },
            uNadir: { value: new THREE.Color( config.gradient.nadir ) },
            uRamp0: { value: new THREE.Color( config.nebula.ramp[ 0 ] ) },
            uRamp1: { value: new THREE.Color( config.nebula.ramp[ 1 ] ) },
            uRamp2: { value: new THREE.Color( config.nebula.ramp[ 2 ] ) },
            uFrequency: { value: nebulaFrequency( config.nebula.featureSizeDeg ) },
            uWarp: { value: config.nebula.warp },
            uRidge: { value: config.nebula.ridge },
            uThreshold: { value: config.nebula.threshold },
            uSoftness: { value: config.nebula.softness },
            uOpacity: { value: config.nebula.opacity },
            uGain: { value: gain },
            uMaskFrequency: { value: nebulaFrequency( config.nebula.mask.featureSizeDeg ) },
            uMaskThreshold: { value: config.nebula.mask.threshold },
            uMaskSoftness: { value: config.nebula.mask.softness },
            uDustFrequency: { value: nebulaFrequency( config.nebula.dust.featureSizeDeg ) },
            uDustThreshold: { value: config.nebula.dust.threshold },
            uDustSoftness: { value: config.nebula.dust.softness },
            uDustStrength: { value: config.nebula.dust.strength },
            uStarDir: {
                value: new THREE.Vector3( ...starDirection( config.starBearingDeg, config.starElevationDeg ) ),
            },
            uLightContrast: { value: config.nebula.lightContrast },
            uCoreOnset: { value: config.nebula.coreOnset },
        } ),
        [ config, gain ],
    );

    return (
        <mesh scale={ config.radius }>
            <sphereGeometry args={ [ 1, 32, 16 ] } />
            { /* `key` on the octave count: OCTAVES is a #define, and three caches the compiled program — a
                 fresh material is the cheapest way to make an octave edit actually recompile under HMR. */ }
            <shaderMaterial
                ref={ materialRef }
                key={ config.nebula.octaves }
                vertexShader={ VERTEX_SHADER }
                fragmentShader={ FRAGMENT_SHADER }
                uniforms={ uniforms }
                defines={ {
                    OCTAVES: config.nebula.octaves,
                    // Fixed, not art knobs. Warp is 2 because measurement showed 6 buys nothing; mask is 2
                    // because the band structure is shape, not detail; dust is 3 to keep clump edges soft.
                    WARP_OCTAVES: 2,
                    MASK_OCTAVES: 2,
                    DUST_OCTAVES: 3,
                } }
                side={ THREE.BackSide }
                depthWrite={ false }
                toneMapped={ false }
            />
        </mesh>
    );
}
