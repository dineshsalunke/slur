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
 * PROVISIONAL — the base colour and roughness belong to the dark material family the `art/track` lane is
 * defining. Adopt its values when task 2's slice 2 lands rather than letting two dark-metal languages drift
 * apart. The seam and the bevel are this lane's and are not downstream of it.
 */

/** Warm core of the seam — the brightest point of the ramp. */
export const SEAM_CORE_COLOR = '#FFE0A0';
/** Hot amber shoulder the core falls off into. No red: the frozen palette excludes it. */
export const SEAM_GLOW_COLOR = '#FFB52E';
/** Dark mass. Deliberately near the ribbon's near-black rather than a separate grey. */
export const BLOCK_BASE_COLOR = '#0B0C0F';

/** Seam centre-line distance in from the chosen vertical corner, world units. */
export const SEAM_INSET = 0.55;
/** Half-width of the bright core, world units. The visible groove runs to 3× this. */
export const SEAM_HALF_WIDTH = 0.06;
/** Emissive punch. Tone mapping is ON (ACES), so this must clear 1.0 to read and to trip bloom. */
export const SEAM_INTENSITY = 6;
/** Width of the shaded bevel band along every edge, world units. */
export const CHAMFER = 0.18;

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
`;

/**
 * Bevel, injected after `<normal_fragment_begin>`. Near an edge the normal leans toward the adjacent face,
 * so the bevel catches light like real geometry instead of being a painted line — which matters because the
 * shipped rig is soft and low-contrast, and a painted line would not respond to it at all.
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
vec3 lean = clamp( ( uChamfer - blockEdge ) / uChamfer, 0.0, 1.0 ) * sign( vBlockPos );
lean *= 1.0 - abs( objNormal );
vec3 bent = normalize( objNormal + lean );

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
`;

        shader.fragmentShader = shader.fragmentShader
            .replace( 'void main() {', `${ fragmentHead }\nvoid main() {` )
            .replace( '#include <color_fragment>', `#include <color_fragment>\n${ SEALED_BLOCK_FRAGMENT_MASKS }` )
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
    material.customProgramCacheKey = () => 'sealed-block-v1';

    return material;
}
