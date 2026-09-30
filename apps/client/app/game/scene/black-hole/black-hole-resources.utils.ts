import * as THREE from 'three';
import { NOISE_SEED, NOISE_SIZE } from './black-hole.constants';
import { FULLSCREEN_VERT } from './black-hole-geodesic.constants';
import { noiseVolumeData } from './black-hole-noise.utils';

export function target( size: number, count: number ): THREE.WebGLRenderTarget {
    return new THREE.WebGLRenderTarget( size, size, {
        count,
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        depthBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        generateMipmaps: false,
    } );
}

export function gbufferTarget( size: number ): THREE.WebGLRenderTarget {
    const t = target( size, 4 );
    for ( const [ i, texture ] of t.textures.entries() ) {
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        if ( i < 2 ) {
            texture.format = THREE.RGFormat;
            texture.type = THREE.FloatType;
        }
    }
    return t;
}

export function noiseTexture(): THREE.Data3DTexture {
    const texture = new THREE.Data3DTexture(
        noiseVolumeData( NOISE_SIZE, NOISE_SEED ),
        NOISE_SIZE,
        NOISE_SIZE,
        NOISE_SIZE,
    );
    texture.format = THREE.RedFormat;
    texture.type = THREE.UnsignedByteType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapR = THREE.RepeatWrapping;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
    return texture;
}

export function pass( fragmentShader: string, uniforms: Record< string, THREE.IUniform > ): THREE.RawShaderMaterial {
    return new THREE.RawShaderMaterial( {
        glslVersion: THREE.GLSL3,
        vertexShader: FULLSCREEN_VERT,
        fragmentShader,
        uniforms,
        depthTest: false,
        depthWrite: false,
    } );
}
