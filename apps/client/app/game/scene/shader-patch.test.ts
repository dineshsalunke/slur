import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { chainShaderPatch } from './shader-patch';

const compile = ( mat: THREE.Material ): string => {
    const shader = {
        uniforms: {},
        vertexShader: '',
        fragmentShader: '',
    } as unknown as THREE.WebGLProgramParametersWithUniforms;
    mat.onBeforeCompile( shader, {} as THREE.WebGLRenderer );
    return shader.vertexShader;
};

const tagger = ( tag: string ) => ( shader: THREE.WebGLProgramParametersWithUniforms ) => {
    shader.vertexShader += tag;
};

describe( 'chainShaderPatch', () => {
    it( 'applies each tag once when a chain of patches is attached twice', () => {
        const mat = new THREE.MeshStandardMaterial();
        for ( let i = 0; i < 3; i++ ) {
            chainShaderPatch( mat, 'a', tagger( 'a' ) );
            chainShaderPatch( mat, 'b', tagger( 'b' ) );
        }
        expect( compile( mat ) ).toBe( 'ab' );
    } );

    it( 'reports whether it patched', () => {
        const mat = new THREE.MeshStandardMaterial();
        expect( chainShaderPatch( mat, 'a', tagger( 'a' ) ) ).toBe( true );
        expect( chainShaderPatch( mat, 'a', tagger( 'a' ) ) ).toBe( false );
    } );

    it( 'patches again after the chain is replaced', () => {
        const mat = new THREE.MeshStandardMaterial();
        chainShaderPatch( mat, 'a', tagger( 'a' ) );
        mat.onBeforeCompile = tagger( 'x' );
        chainShaderPatch( mat, 'a', tagger( 'a' ) );
        expect( compile( mat ) ).toBe( 'xa' );
    } );
} );
