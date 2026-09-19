import { BLOCK_HEIGHT } from '@slur/shared';
import * as THREE from 'three';

/**
 * The sealed deadly block's surface: a dark mass with one recessed marigold seam and shaded edge bevels.
 *
 * EVERYTHING IS SHADING — the mesh stays a literal unit box. That is what makes "nothing protrudes outside
 * the AABB" true BY CONSTRUCTION: the renderer scales this box by each block's own `[x0,x1]×[y0,y1]×[z0,z1]`,
 * so the drawn hull IS the hull the ship's footprint tests against, and no later edit can quietly break it.
 * A geometric bevel could not make that promise, and at 55 u/s on an 8u block its contour delta is about one
 * pixel — what a player actually sees is a rim-highlight band, which shading holds at constant world width
 * and geometry cannot without stretching per instance.
 *
 * WHY BOX-LOCAL WORLD UNITS AND NOT TRIPLANAR: blocks are instanced by position and non-uniform scale and
 * are NEVER rotated (`put()` in `game/scene/track-view.tsx` sets only `.position` and `.scale`). Object
 * space is therefore world space up to an axis-aligned scale, so the instance matrix alone yields un-stretched
 * world-unit coordinates — `length(instanceMatrix[i].xyz)` IS that instance's extent on axis i. Triplanar
 * exists to handle arbitrary rotation we do not have; it would pay three samples and a blend per fragment,
 * forever, for a property we get from six vertex ALU ops and zero texture samples. Feature sizes below are
 * in world units, so a seam is the same width on a 4u block and a 5.5u block for free.
 *
 * Non-uniform instance scale does NOT break the shading: three applies the inverse-scale normal correction
 * under `USE_INSTANCING` (`ShaderChunk/defaultnormal_vertex.glsl.js`, three 0.185.1).
 *
 * PROVISIONAL — the base COLOUR belongs to the dark material family the `art/track` lane is defining; adopt
 * its value when task 2's slice 2 lands rather than letting two dark-metal languages drift apart.
 * ROUGHNESS is NOT downstream of it: `game/scene/track-materials.ts` defines `FLOOR_SURFACE`,
 * `LETHAL_SURFACE`, `DRAG_SURFACE` and `RAIL_SURFACE`, and not one carries a `roughness` key — the number
 * below is the only one there is. The seam, the bevel and the finish are this lane's.
 */

/** Warm core of the seam — the brightest point of the ramp. */
export const SEAM_CORE_COLOR = '#FFE0A0';
/** Hot amber shoulder the core falls off into. No red: the frozen palette excludes it. */
export const SEAM_GLOW_COLOR = '#FFB52E';
/** Dark mass. Deliberately near the ribbon's near-black rather than a separate grey. */
export const BLOCK_BASE_COLOR = '#0B0C0F';

/** Seam centre-line distance in from the chosen vertical corner, world units. */
export const SEAM_INSET = 0.55;

/**
 * Measured off board 10: the visible seam is ~2.5% of the 8u height. Against HEIGHT because that is the only
 * dimension `ART_SCALE_REFERENCE.md` §2 fixes — a width ratio would also make the seam stretch per instance,
 * which board 10's panel 3 rules out by drawing CUBE and WIDE with the same thickness.
 */
const SEAM_WIDTH_PER_HEIGHT = 0.025;
/** Half-width of the VISIBLE seam — the groove, which is what the eye measures. World units. */
export const SEAM_TROUGH_HALF_WIDTH = ( BLOCK_HEIGHT * SEAM_WIDTH_PER_HEIGHT ) / 2;
/** Half-width of the bright core, world units. The visible groove runs to 3× this. */
export const SEAM_HALF_WIDTH = SEAM_TROUGH_HALF_WIDTH / 3;
/** Emissive punch. Tone mapping is ON (ACES), so this must clear 1.0 to read and to trip bloom. */
export const SEAM_INTENSITY = 6;
/** Width of the shaded bevel band along every edge, world units. */
export const CHAMFER = 0.18;

/**
 * Curve on the bevel's lean. The linear ramp measured ~6-8px against a nominal ~15px, because lean is near
 * zero across the outer half of the band; a gamma pushes it out to the authored width.
 */
export const CHAMFER_GAMMA = 2.2;

/**
 * A dark crease at the very edge, so an edge reads face → light rim → dark line → face. The bevel brightens
 * an edge only where its lean turns toward the light, which measured as nothing at the interior corner. A
 * darkening does not care which way the lean tilts.
 */
export const CREASE_HALF_WIDTH = 0.035;
/** How far the crease darkens the albedo. */
export const CREASE_DARKEN = 0.6;

/**
 * Vertical panel splits — dark inset hairlines, no marigold. Pitch is a world constant, not a per-face count:
 * board 10 draws WIDE with MORE splits than CUBE at the same spacing. Vertical only — a horizontal groove on
 * an un-jumpable block reads as a ledge.
 */
export const SPLIT_PITCH = 1.6;
/** Half-width of a split hairline, world units. */
export const SPLIT_HALF_WIDTH = 0.035;
/** How far a split darkens the albedo. */
export const SPLIT_DARKEN = 0.55;

/**
 * Surface finish. Board 10's faces carry broad blotches ~a quarter of the 8u height over a finer filament
 * layer; three octaves from here cover both. World units, so the grain is identical on every footprint.
 */
export const DETAIL_BASE_SIZE = 2.5;
export const DETAIL_OCTAVES = 3;
/** Albedo swing, as a fraction. The primary term — finish is a value variation first. */
export const DETAIL_ALBEDO = 0.35;
/**
 * Normal perturbation from the same field, tunable to ZERO. Buys the GRAZING case only — an unlit face has
 * N·L ~0 and stays there under any perturbation small enough to keep the surface intact, so that read is a
 * bounce problem for `/art-lab`. TUNE THIS ON A GRAZING FACE: tuning it against a black face drives it to
 * noisy and plastic on the lit one long before the black one lights up. The single star means the interior
 * vertical corner is the ONLY grazing light in this route, so that corner is the one place it can ever show
 * — judging it anywhere else on `/iso-block` is judging a term that is not participating.
 */
export const DETAIL_NORMAL = 0.15;

/**
 * Roughness swing, as a fraction of whatever base this material carries. THE PRIMARY FINISH TERM, not a
 * garnish: measured, the block renders ~85-90% NON-DIFFUSE — zeroing albedo outright moved the lit face only
 * 48-65 → 45-57 — so every albedo-only feature is diluted below JPEG noise while roughness modulates the
 * term that actually paints the face. UNJUDGED: 0.35 matches `DETAIL_ALBEDO` so the two read as one material
 * event at equal strength, and it is a first guess, not a tuned value.
 */
export const DETAIL_ROUGH = 0.35;

/**
 * Declarations shared by both stages. `vBlockPos`/`vBlockSize` are the un-stretched box-local frame;
 * `vAxis*` carry the object axes into view space so the fragment stage can bend a normal without
 * re-deriving three's instanced-normal chain (`normal_fragment_begin` leaves `normal` in VIEW space).
 */
const VARYINGS = /* glsl */ `
varying vec3 vBlockPos;
varying vec3 vBlockSize;
varying vec2 vSeamCorner;
varying vec3 vAxisX;
varying vec3 vAxisY;
varying vec3 vAxisZ;
`;

/**
 * Vertex body, injected after `<begin_vertex>`.
 *
 * MUST NOT WRITE `transformed` OR `gl_Position` — that is the whole AABB guarantee, and
 * `sealed-block-material.test.ts` asserts it so a future edit cannot quietly displace a vertex.
 */
export const SEALED_BLOCK_VERTEX = /* glsl */ `
#ifdef USE_INSTANCING
    vBlockSize = vec3(
        length( instanceMatrix[ 0 ].xyz ),
        length( instanceMatrix[ 1 ].xyz ),
        length( instanceMatrix[ 2 ].xyz )
    );
    vec2 cornerSeed = floor( instanceMatrix[ 3 ].xz + 0.5 );
#else
    vBlockSize = vec3( 1.0 );
    vec2 cornerSeed = vec2( 0.0 );
#endif

vBlockPos = position * vBlockSize;

// Which of the four vertical corners carries the seam, hashed off the instance's own world centre. Three
// footprints all seamed at the same corner would read as one asset repeated; this is free per-instance
// variation with no extra attribute. Cosmetic and client-side, so there is nothing here to desync.
float cornerHash = fract( sin( dot( cornerSeed, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
vSeamCorner = vec2(
    cornerHash < 0.5 ? -1.0 : 1.0,
    fract( cornerHash * 2.0 ) < 0.5 ? -1.0 : 1.0
);

vAxisX = normalize( normalMatrix * vec3( 1.0, 0.0, 0.0 ) );
vAxisY = normalize( normalMatrix * vec3( 0.0, 1.0, 0.0 ) );
vAxisZ = normalize( normalMatrix * vec3( 0.0, 0.0, 1.0 ) );
`;

/**
 * Value-noise fbm, declared ahead of `main()`. Zero texture samples — the same trick the seam and the bevel
 * already use, authored in the un-stretched box-local frame so the grain is instance-invariant by
 * construction rather than by assertion.
 *
 * The hash is sin-free on purpose: `sin`-based hashes are transcendental and precision-dependent across
 * drivers. Nothing here feeds the sim — this is cosmetic, client-side shading — but a cheap integer-ish hash
 * is both faster and better behaved.
 *
 * `blockFbm` takes the per-pixel world footprint and fades an octave out as its feature size approaches a
 * pixel. That is the feature, not a mitigation: board 10's own panel 1 shows near blocks keeping the broad
 * blotches while mid-distance blocks reduce to flat silhouettes carrying only the seam. Procedural noise has
 * no mip chain, so without this it would shimmer on approach instead of resolving away.
 */
const NOISE_GLSL = /* glsl */ `
float blockHash( vec3 p ) {
    p = fract( p * 0.3183099 + vec3( 0.71, 0.113, 0.419 ) );
    p *= 17.0;
    return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}

float blockNoise( vec3 p ) {
    vec3 i = floor( p );
    vec3 f = fract( p );
    f = f * f * ( 3.0 - 2.0 * f );
    return mix(
        mix(
            mix( blockHash( i + vec3( 0.0, 0.0, 0.0 ) ), blockHash( i + vec3( 1.0, 0.0, 0.0 ) ), f.x ),
            mix( blockHash( i + vec3( 0.0, 1.0, 0.0 ) ), blockHash( i + vec3( 1.0, 1.0, 0.0 ) ), f.x ),
            f.y
        ),
        mix(
            mix( blockHash( i + vec3( 0.0, 0.0, 1.0 ) ), blockHash( i + vec3( 1.0, 0.0, 1.0 ) ), f.x ),
            mix( blockHash( i + vec3( 0.0, 1.0, 1.0 ) ), blockHash( i + vec3( 1.0, 1.0, 1.0 ) ), f.x ),
            f.y
        ),
        f.z
    );
}

float blockFbm( vec3 p, float worldPerPixel ) {
    float sum = 0.0;
    float weight = 0.0;
    float size = uDetailSize;
    float amp = 1.0;
    for ( int i = 0; i < ${ DETAIL_OCTAVES }; i ++ ) {
        // An octave whose feature size is approaching one pixel can no longer be resolved, only aliased.
        float vis = smoothstep( worldPerPixel * 1.5, worldPerPixel * 4.0, size );
        sum += blockNoise( p / size ) * amp * vis;
        weight += amp * vis;
        size *= 0.5;
        amp *= 0.55;
    }
    return weight > 0.0 ? sum / weight : 0.5;
}
`;

/**
 * Masks + the groove's darkening, injected after `<color_fragment>`. Locals declared here stay in scope for
 * the later injections — they are all one `main()`.
 */
export const SEALED_BLOCK_FRAGMENT_MASKS = /* glsl */ `
vec3 blockHalf = vBlockSize * 0.5;
// Distance from this fragment to each of the three face planes. On a box the smallest one names the face.
vec3 blockEdge = blockHalf - abs( vBlockPos );
bool faceIsX = blockEdge.x <= blockEdge.y && blockEdge.x <= blockEdge.z;
bool faceIsZ = blockEdge.z <= blockEdge.x && blockEdge.z <= blockEdge.y;

// Clamped so a block narrower than twice the inset keeps its seam inboard instead of folding it past the
// centre — the family is continuous, so the degenerate end of the range has to be handled, not assumed away.
float insetX = min( uSeamInset, blockHalf.x * 0.5 );
float insetZ = min( uSeamInset, blockHalf.z * 0.5 );

float seamDist = 1e9;
if ( faceIsX && vBlockPos.x * vSeamCorner.x > 0.0 ) {
    seamDist = abs( vBlockPos.z - vSeamCorner.y * ( blockHalf.z - insetZ ) );
} else if ( faceIsZ && vBlockPos.z * vSeamCorner.y > 0.0 ) {
    seamDist = abs( vBlockPos.x - vSeamCorner.x * ( blockHalf.x - insetX ) );
}

// The seam appears only on the two faces meeting at the chosen corner, and runs the full 8u height. It is
// never on the top or bottom face: a horizontal band across a face implies a LEDGE, and this block is
// un-jumpable by design, so that would be a gameplay lie. Board 10's only horizontal run is along the top
// EDGE, where the bevel highlight below already lives and nothing can read as a step.
float seamCore = 1.0 - smoothstep( 0.0, uSeamHalfWidth, seamDist );
float seamTrough = 1.0 - smoothstep( uSeamHalfWidth, uSeamHalfWidth * 3.0, seamDist );

diffuseColor.rgb *= 1.0 - 0.75 * seamTrough;

// World units covered by one pixel here — drives every octave fade below.
float worldPerPixel = max( fwidth( vBlockPos.x ), max( fwidth( vBlockPos.y ), fwidth( vBlockPos.z ) ) );

// VERTICAL PANEL SPLITS.
// The pitch is snapped so an EVEN number of panels spans the face. That makes the split field symmetric
// about the face centre and puts the outermost split exactly half a pitch inside the edge — a constant world
// pitch against a continuous width range would otherwise eventually land a split a hair from the corner,
// where it stops reading as a panel line and starts reading as a chipped edge.
float splitTangent = faceIsX ? vBlockPos.z : vBlockPos.x;
float splitFaceWidth = 2.0 * ( faceIsX ? blockHalf.z : blockHalf.x );
float splitCount = max( 2.0, 2.0 * floor( splitFaceWidth / ( 2.0 * uSplitPitch ) + 0.5 ) );
float splitPitch = splitFaceWidth / splitCount;
float splitDist = abs( fract( splitTangent / splitPitch ) - 0.5 ) * splitPitch;
// Top and bottom faces stay unsplit: the splits are vertical, and a groove across the top would read as a
// seam on a surface the player never touches.
// worldPerPixel is a FULL pixel footprint, so it is compared against the line's FULL width — the half-width
// doubled. Comparing the half directly demanded ~8 device px before a line passed, and faded one still 5 wide.
// (No backticks in GLSL comments: these blocks are template literals and a backtick terminates one.)
float splitVisible = smoothstep( worldPerPixel * 1.5, worldPerPixel * 4.0, uSplitHalfWidth * 2.0 );
float split = ( faceIsX || faceIsZ )
    ? ( 1.0 - smoothstep( 0.0, uSplitHalfWidth, splitDist ) ) * splitVisible
    : 0.0;

// SURFACE FINISH. Albedo is the primary term — a face reads as material because its value varies.
float detail = blockFbm( vBlockPos, worldPerPixel );
diffuseColor.rgb *= 1.0 + uDetailAlbedo * ( detail - 0.5 ) * 2.0;

// Splits carry NO marigold, ever. They are a darkening of the albedo and nothing else: a second warm line on
// the same face would dilute the one feature carrying hazard identity at range.
diffuseColor.rgb *= 1.0 - uSplitDarken * split;
`;

/**
 * Finish, injected after `<roughnessmap_fragment>`. Reuses the `detail` field already evaluated above — no
 * second fbm, no sampler, one multiply.
 *
 * RELATIVE, never absolute: it scales three's own `roughnessFactor`, which the chunk seeds from
 * `material.roughness`, so there is no second copy of a base value to drift out of step. The sign couples it
 * to the albedo term — a lighter patch is also a tighter reflection — so a blotch reads as one material event
 * rather than two unrelated fields. three clamps the result at both ends itself
 * (`ShaderChunk/lights_physical_fragment.glsl.js` 10-12, three 0.185.1), so no clamp belongs here.
 */
export const SEALED_BLOCK_FRAGMENT_ROUGHNESS = /* glsl */ `
roughnessFactor *= 1.0 - uDetailRough * ( detail - 0.5 ) * 2.0;
`;

/**
 * Bevel, injected after `<normal_fragment_begin>`. Near an edge the normal leans toward the adjacent face, so
 * the bevel catches light like real geometry instead of being a painted line.
 *
 * The earlier rationale — "the rig is soft, so a painted line would not respond" — is DEAD; measured, the
 * sky rig is strongly directional. The lean earns its place for the opposite reason: under one hard light a
 * tilt is the only thing that changes what a fragment catches. It reads on silhouette edges and produces
 * nothing at the interior corner, which is why the crease exists.
 */
export const SEALED_BLOCK_FRAGMENT_NORMAL = /* glsl */ `
vec3 objNormal = vec3( 0.0 );
if ( faceIsX ) {
    objNormal.x = sign( vBlockPos.x );
} else if ( faceIsZ ) {
    objNormal.z = sign( vBlockPos.z );
} else {
    objNormal.y = sign( vBlockPos.y );
}

// Lean toward whichever faces this fragment is near, but never along our own axis — on the face plane
// blockEdge is ~0 for that axis, which would otherwise read as maximum lean.
vec3 leanRamp = clamp( ( uChamfer - blockEdge ) / uChamfer, 0.0, 1.0 );
vec3 lean = pow( leanRamp, vec3( uChamferGamma ) ) * sign( vBlockPos );
lean *= 1.0 - abs( objNormal );
vec3 bent = normalize( objNormal + lean );

// Perturb along the two face tangents. Deliberately NOT a normal map: the field is the same fbm already
// evaluated for albedo, sampled twice more to get its slope, so there is no sampler and no tangent basis.
vec3 tangentA = faceIsX ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
vec3 tangentB = faceIsZ ? vec3( 0.0, 1.0, 0.0 ) : vec3( 0.0, 0.0, 1.0 );
float detailStep = max( worldPerPixel, uDetailSize * 0.05 );
float detailA = blockFbm( vBlockPos + tangentA * detailStep, worldPerPixel );
float detailB = blockFbm( vBlockPos + tangentB * detailStep, worldPerPixel );
bent -= uDetailNormal * ( ( detailA - detail ) * tangentA + ( detailB - detail ) * tangentB ) / detailStep;

// The crease, last: a darkening rather than a tilt, so the edge reads even where the lean turns away from
// the light and brightens nothing.
float creaseDist = min( blockEdge.x, min( blockEdge.y, blockEdge.z ) );
float crease = ( 1.0 - smoothstep( 0.0, uCreaseHalfWidth, creaseDist ) )
    // Full width against a full pixel footprint, as in the split gate above.
    * smoothstep( worldPerPixel * 1.5, worldPerPixel * 4.0, uCreaseHalfWidth * 2.0 );
diffuseColor.rgb *= 1.0 - uCreaseDarken * crease;

normal = normalize( vAxisX * bent.x + vAxisY * bent.y + vAxisZ * bent.z );
`;

/** The seam's light, injected after `<emissivemap_fragment>`. */
export const SEALED_BLOCK_FRAGMENT_EMISSIVE = /* glsl */ `
vec3 seamColor = mix( uSeamGlow, uSeamCore, seamCore );
totalEmissiveRadiance += seamColor * uSeamIntensity * ( seamCore + 0.25 * seamTrough );
`;

/**
 * Build the material. Extends `MeshStandardMaterial` via `onBeforeCompile` rather than authoring a shader
 * from scratch: that keeps the shipped PBR lighting and the ACES tone-mapped path intact, where drei's
 * `shaderMaterial` would throw the lighting away and `three-custom-shader-material` is not installed.
 *
 * `toneMapped` stays at its default — task 2's D3 removes the shipped `toneMapped: false`, and everything
 * now authors for the tone-mapped frame.
 */
export function createSealedBlockMaterial(): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial( {
        color: new THREE.Color( BLOCK_BASE_COLOR ),
        roughness: 0.55,
        // Metalness stays 0: a metal surface with no environment contribution renders black, and the block
        // reads as dark stone on the board, not as metal.
        metalness: 0,
    } );

    material.onBeforeCompile = ( shader ) => {
        shader.uniforms.uSeamInset = { value: SEAM_INSET };
        shader.uniforms.uSeamHalfWidth = { value: SEAM_HALF_WIDTH };
        shader.uniforms.uChamfer = { value: CHAMFER };
        shader.uniforms.uSeamIntensity = { value: SEAM_INTENSITY };
        shader.uniforms.uSeamCore = { value: new THREE.Color( SEAM_CORE_COLOR ) };
        shader.uniforms.uSeamGlow = { value: new THREE.Color( SEAM_GLOW_COLOR ) };
        shader.uniforms.uChamferGamma = { value: CHAMFER_GAMMA };
        shader.uniforms.uCreaseHalfWidth = { value: CREASE_HALF_WIDTH };
        shader.uniforms.uCreaseDarken = { value: CREASE_DARKEN };
        shader.uniforms.uSplitPitch = { value: SPLIT_PITCH };
        shader.uniforms.uSplitHalfWidth = { value: SPLIT_HALF_WIDTH };
        shader.uniforms.uSplitDarken = { value: SPLIT_DARKEN };
        shader.uniforms.uDetailSize = { value: DETAIL_BASE_SIZE };
        shader.uniforms.uDetailAlbedo = { value: DETAIL_ALBEDO };
        shader.uniforms.uDetailNormal = { value: DETAIL_NORMAL };
        shader.uniforms.uDetailRough = { value: DETAIL_ROUGH };

        shader.vertexShader = shader.vertexShader
            .replace( 'void main() {', `${ VARYINGS }\nvoid main() {` )
            .replace( '#include <begin_vertex>', `#include <begin_vertex>\n${ SEALED_BLOCK_VERTEX }` );

        const fragmentHead = `${ VARYINGS }
uniform float uSeamInset;
uniform float uSeamHalfWidth;
uniform float uChamfer;
uniform float uSeamIntensity;
uniform vec3 uSeamCore;
uniform vec3 uSeamGlow;
uniform float uChamferGamma;
uniform float uCreaseHalfWidth;
uniform float uCreaseDarken;
uniform float uSplitPitch;
uniform float uSplitHalfWidth;
uniform float uSplitDarken;
uniform float uDetailSize;
uniform float uDetailAlbedo;
uniform float uDetailNormal;
uniform float uDetailRough;
${ NOISE_GLSL }
`;

        shader.fragmentShader = shader.fragmentShader
            .replace( 'void main() {', `${ fragmentHead }\nvoid main() {` )
            .replace( '#include <color_fragment>', `#include <color_fragment>\n${ SEALED_BLOCK_FRAGMENT_MASKS }` )
            // `<roughnessmap_fragment>` sits after `<color_fragment>` and before `<normal_fragment_begin>`
            // (`meshphysical.glsl.js` 172/176/178, three 0.185.1), so `detail` is already in scope here.
            .replace(
                '#include <roughnessmap_fragment>',
                `#include <roughnessmap_fragment>\n${ SEALED_BLOCK_FRAGMENT_ROUGHNESS }`,
            )
            .replace(
                '#include <normal_fragment_begin>',
                `#include <normal_fragment_begin>\n${ SEALED_BLOCK_FRAGMENT_NORMAL }`,
            )
            .replace(
                '#include <emissivemap_fragment>',
                `#include <emissivemap_fragment>\n${ SEALED_BLOCK_FRAGMENT_EMISSIVE }`,
            );
    };

    // Distinct key so three never shares a compiled program between this and a plain standard material.
    material.customProgramCacheKey = () => 'sealed-block-v3';

    return material;
}
