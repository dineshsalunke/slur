import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { deckBreakupFragment, deckBreakupUniforms, patchDeckBreakup } from './deck-breakup';

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

    it( 'patches once, so a repeated attach still compiles', () => {
        const mat = new THREE.MeshStandardMaterial();
        const uniforms = deckBreakupUniforms();
        patchDeckBreakup( mat, uniforms );
        const first = mat.onBeforeCompile;
        const key = mat.customProgramCacheKey();
        patchDeckBreakup( mat, uniforms );
        expect( mat.onBeforeCompile ).toBe( first );
        expect( mat.customProgramCacheKey() ).toBe( key );
        const shader = {
            uniforms: {},
            vertexShader: THREE.ShaderLib.physical.vertexShader,
            fragmentShader: THREE.ShaderLib.physical.fragmentShader,
        } as unknown as THREE.WebGLProgramParametersWithUniforms;
        expect( () => mat.onBeforeCompile( shader, {} as THREE.WebGLRenderer ) ).not.toThrow();
    } );
} );
