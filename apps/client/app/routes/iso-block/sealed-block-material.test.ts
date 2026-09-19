import { describe, expect, it } from 'vitest';
import {
    SEALED_BLOCK_FRAGMENT_EMISSIVE,
    SEALED_BLOCK_FRAGMENT_MASKS,
    SEALED_BLOCK_FRAGMENT_NORMAL,
    SEALED_BLOCK_VERTEX,
    SEAM_CORE_COLOR,
    SEAM_GLOW_COLOR,
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
