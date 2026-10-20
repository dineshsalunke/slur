import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { blotchWearUniforms } from './deck-breakup';
import { patchWallBreakup, wallBreakupFragment, wallBreakupVertex } from './wall-breakup';

describe( 'wall breakup', () => {
    const frag = wallBreakupFragment( THREE.ShaderLib.physical.fragmentShader );
    const vert = wallBreakupVertex( THREE.ShaderLib.physical.vertexShader );

    it( 'keeps every map include and appends after it', () => {
        for ( const chunk of [ 'map_fragment', 'roughnessmap_fragment', 'metalnessmap_fragment' ] ) {
            expect( frag ).toContain( `#include <${ chunk }>\n` );
        }
        expect( frag.indexOf( 'wallShade' ) ).toBeGreaterThan( frag.indexOf( '#include <map_fragment>' ) );
    } );

    it( 'takes the blotch from the world position, not the uv', () => {
        expect( vert ).toContain( 'vWallWorld = ( modelMatrix * wallWorld ).xyz;' );
        expect( frag ).toContain( 'deckBlotch( wallPlane( vWallWorld ) )' );
        expect( frag ).not.toContain( 'vMapUv * uDeckWorldPerUv' );
    } );

    it( 'drives roughness and metalness from the blotch wear', () => {
        expect( frag ).toContain( 'roughnessFactor -= roughness * wallWear * uWearRoughSpan;' );
        expect( frag ).toContain( 'metalnessFactor + metalness * wallWear * uWearMetalSlope' );
    } );

    it( 'patches once, and again after a prior patch is replaced', () => {
        const mat = new THREE.MeshStandardMaterial();
        const uniforms = blotchWearUniforms();
        patchWallBreakup( mat, uniforms );
        const first = mat.onBeforeCompile;
        patchWallBreakup( mat, uniforms );
        expect( mat.onBeforeCompile ).toBe( first );
        mat.onBeforeCompile = () => {};
        patchWallBreakup( mat, uniforms );
        expect( mat.onBeforeCompile ).not.toBe( first );
        expect( mat.customProgramCacheKey() ).toMatch( /-wall-breakup$/ );
    } );
} );
