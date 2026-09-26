import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { deckBreakupFragment } from './deck-breakup';

describe( 'deck breakup', () => {
    const out = deckBreakupFragment( THREE.ShaderLib.physical.fragmentShader );

    it( 'replaces every map include it patches', () => {
        for ( const chunk of [
            'map_fragment',
            'roughnessmap_fragment',
            'metalnessmap_fragment',
            'normal_fragment_maps',
        ] ) {
            expect( out ).not.toContain( `#include <${ chunk }>` );
        }
    } );

    it( 'samples every surface map through the shuffled uv', () => {
        for ( const map of [ 'map', 'roughnessMap', 'metalnessMap', 'normalMap' ] ) {
            expect( out ).toContain( `textureGrad( ${ map }, deckUv, deckDx, deckDy )` );
            expect( out ).not.toMatch( new RegExp( `texture2D\\( ${ map }, ` ) );
        }
    } );

    it( 'mirrors the tangent normal with the plate flip', () => {
        expect( out ).toContain( 'mapN.xy *= normalScale * deckFlip;' );
    } );

    it( 'drives roughness and metalness from the blotch wear', () => {
        expect( out ).toContain( 'roughnessFactor *= texelRoughness.g - deckWear * uWearRoughSpan;' );
        expect( out ).toContain( 'texelMetalness.b + deckWear * uWearMetalSlope' );
    } );
} );
