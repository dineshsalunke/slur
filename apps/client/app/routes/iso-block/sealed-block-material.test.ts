import { BLOCK_HEIGHT } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import {
    SEALED_BLOCK_FRAGMENT_EMISSIVE,
    SEALED_BLOCK_FRAGMENT_MASKS,
    SEALED_BLOCK_FRAGMENT_NORMAL,
    SEALED_BLOCK_FRAGMENT_ROUGHNESS,
    SEALED_BLOCK_VERTEX,
    SEAM_CORE_COLOR,
    SEAM_GLOW_COLOR,
    SEAM_HALF_WIDTH,
    SEAM_TROUGH_HALF_WIDTH,
} from './sealed-block-material';

/**
 * THE AABB GATE.
 *
 * The block's mesh IS its physics hull — the renderer scales a unit box by each block's own AABB, so a
 * silhouette detail that juts out would kill the player on apparent empty air. This lane's whole design
 * answer is that the geometry stays a literal box and every detail is shading, which makes "nothing
 * protrudes" true by construction. This test is what stops a later edit from quietly giving that up: the
 * moment the vertex stage writes a position, the guarantee is gone and nothing else would notice.
 */
describe( 'sealed block vertex stage', () => {
    it( 'never displaces a vertex — the drawn hull stays exactly the AABB', () => {
        expect( SEALED_BLOCK_VERTEX ).not.toMatch( /\btransformed\s*[-+*/]?=/ );
        expect( SEALED_BLOCK_VERTEX ).not.toMatch( /\bgl_Position\s*=/ );
    } );

    it( "reads each instance's real extent off the instance matrix", () => {
        expect( SEALED_BLOCK_VERTEX ).toContain( 'length( instanceMatrix[ 0 ].xyz )' );
        expect( SEALED_BLOCK_VERTEX ).toContain( 'position * vBlockSize' );
    } );

    it( 'falls back to a unit box when drawn un-instanced, rather than reading a missing attribute', () => {
        expect( SEALED_BLOCK_VERTEX ).toContain( '#ifdef USE_INSTANCING' );
        expect( SEALED_BLOCK_VERTEX ).toContain( '#else' );
    } );
} );

describe( 'sealed block seam', () => {
    // Overriding a board reading on gameplay grounds — a horizontal band across a face implies a ledge, and
    // an 8u block is un-jumpable by design. The seam is only ever vertical, so it can only be keyed off the
    // two side axes.
    it( 'is keyed to the side faces only, never the top or bottom', () => {
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).toContain( 'faceIsX' );
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).toContain( 'faceIsZ' );
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).not.toMatch( /faceIsY/ );
    } );

    it( 'clamps its inset so a narrow block keeps the seam inboard', () => {
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).toContain( 'min( uSeamInset, blockHalf.x * 0.5 )' );
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).toContain( 'min( uSeamInset, blockHalf.z * 0.5 )' );
    } );

    // The frozen palette is a warm ramp against a cold environment: "No cyan, no magenta, no red. A red
    // hazard colour code is explicitly excluded." ADR-009's `Alert Red #FF4B3E` fallback contradicts it and
    // is not this lane's to take.
    it( 'stays on the warm ramp — no red in the hazard vocabulary', () => {
        for ( const hex of [ SEAM_CORE_COLOR, SEAM_GLOW_COLOR ] ) {
            const r = Number.parseInt( hex.slice( 1, 3 ), 16 );
            const g = Number.parseInt( hex.slice( 3, 5 ), 16 );
            const b = Number.parseInt( hex.slice( 5, 7 ), 16 );
            // Marigold/amber carries a strong green component; red hazard cues do not.
            expect( g ).toBeGreaterThan( 0.55 * r );
            expect( b ).toBeLessThan( g );
        }
    } );

    it( 'emits light rather than merely painting the groove', () => {
        expect( SEALED_BLOCK_FRAGMENT_EMISSIVE ).toContain( 'totalEmissiveRadiance' );
    } );
} );

describe( 'sealed block bevel', () => {
    it( 'leans the normal toward adjacent faces instead of painting an edge line', () => {
        expect( SEALED_BLOCK_FRAGMENT_NORMAL ).toContain( 'normal = normalize(' );
        expect( SEALED_BLOCK_FRAGMENT_NORMAL ).toContain( 'uChamfer' );
    } );

    it( "never leans along the fragment's own face axis", () => {
        expect( SEALED_BLOCK_FRAGMENT_NORMAL ).toContain( 'lean *= 1.0 - abs( objNormal );' );
    } );
} );

/**
 * THE PALETTE GATE FOR SPLITS.
 *
 * Panel splits are a darkening of the albedo and nothing else. Marigold is the seam's identity and the one
 * feature that still carries hazard at range once the fbm octaves have faded out; a second warm line on the
 * same face would dilute exactly that. Emissive is the thing to guard, because it is the only way a split
 * could become warm.
 */
describe( 'sealed block panel splits', () => {
    it( 'darkens albedo and never writes emissive', () => {
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).toContain( 'uSplitDarken * split' );
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).not.toMatch( /totalEmissiveRadiance/ );
    } );

    it( 'carries no marigold uniform into the split term', () => {
        const splitLines = SEALED_BLOCK_FRAGMENT_MASKS.split( '\n' ).filter( ( l ) => l.includes( 'split' ) );
        for ( const line of splitLines ) {
            expect( line ).not.toMatch( /uSeamCore|uSeamGlow/ );
        }
    } );

    it( 'spans an EVEN panel count so no split lands against a face edge', () => {
        // Odd counts put a split exactly on the corner, where it reads as a chipped edge rather than a
        // panel line. The family is a continuous width range, so this is reached, not hypothetical.
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).toContain( '2.0 * floor( splitFaceWidth' );
    } );

    it( 'is vertical only — never on the top or bottom face', () => {
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).toContain( '( faceIsX || faceIsZ )' );
    } );
} );

describe( 'sealed block surface finish', () => {
    it( 'samples no texture — the field is procedural in box-local world units', () => {
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).not.toMatch( /texture2D|texture\s*\(/ );
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).toContain( 'blockFbm( vBlockPos' );
    } );

    it( 'fades an octave out as its feature size approaches a pixel', () => {
        // Procedural noise has no mip chain. Without this an approaching block shimmers instead of
        // resolving away, and board 10 shows mid-distance blocks carrying only the seam.
        expect( SEALED_BLOCK_FRAGMENT_MASKS ).toContain( 'fwidth( vBlockPos' );
    } );

    it( 'keeps the normal perturbation tunable to zero', () => {
        expect( SEALED_BLOCK_FRAGMENT_NORMAL ).toContain( 'uDetailNormal' );
    } );
} );

/**
 * THE FORK GATE.
 *
 * The block renders ~85-90% non-diffuse, so roughness is the term that actually paints the face — which is
 * why the finish lives here rather than in albedo alone. The risk it carries is a SECOND base value: the
 * moment this writes an absolute roughness, this material stops following `material.roughness` and a future
 * change to the base silently leaves the finish behind. Relative is the whole decision, so it is the thing
 * guarded.
 */
describe( 'sealed block roughness finish', () => {
    it( 'perturbs relatively and never writes an absolute roughness', () => {
        expect( SEALED_BLOCK_FRAGMENT_ROUGHNESS ).toContain( 'roughnessFactor *=' );
        expect( SEALED_BLOCK_FRAGMENT_ROUGHNESS ).not.toMatch( /roughnessFactor\s*=\s*[^*]/ );
    } );

    it( 'reuses the albedo field rather than evaluating a second fbm', () => {
        expect( SEALED_BLOCK_FRAGMENT_ROUGHNESS ).toContain( 'detail' );
        expect( SEALED_BLOCK_FRAGMENT_ROUGHNESS ).not.toMatch( /blockFbm|texture2D|texture\s*\(/ );
    } );

    it( 'stays tunable to zero, so the finish can be switched off without an edit', () => {
        expect( SEALED_BLOCK_FRAGMENT_ROUGHNESS ).toContain( 'uDetailRough' );
    } );
} );

describe( 'sealed block seam width', () => {
    it( 'is derived from the 8u HEIGHT, not from a free width', () => {
        // Height is the only dimension ART_SCALE_REFERENCE §2 fixes, and a width-proportional seam would
        // contradict the instancing evidence: CUBE and WIDE carry the SAME thickness on board 10.
        expect( SEAM_TROUGH_HALF_WIDTH ).toBeCloseTo( ( BLOCK_HEIGHT * 0.025 ) / 2 );
        expect( SEAM_HALF_WIDTH ).toBeCloseTo( SEAM_TROUGH_HALF_WIDTH / 3 );
    } );
} );
