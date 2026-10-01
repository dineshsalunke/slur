import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { col, num } from '../../../dev/tuning';
import { BAND_FEATHER, BAND_FRAGMENT, BAND_VERTEX } from './env-band.constants';

const material = new THREE.ShaderMaterial( {
    uniforms: {
        hdri: { value: null },
        bandColor: { value: new THREE.Color() },
        halfHeight: { value: 0 },
        feather: { value: BAND_FEATHER },
    },
    vertexShader: BAND_VERTEX,
    fragmentShader: BAND_FRAGMENT,
    depthTest: false,
    depthWrite: false,
} );

const quad = new FullScreenQuad( material );

const band = {
    renderer: null as THREE.WebGLRenderer | null,
    target: null as THREE.WebGLRenderTarget | null,
    source: null as THREE.Texture | null,
    color: '',
    intensity: Number.NaN,
    height: Number.NaN,
};

function targetFor( renderer: THREE.WebGLRenderer, width: number, height: number ): THREE.WebGLRenderTarget {
    const same = band.renderer === renderer;
    if ( same && band.target && band.target.width === width && band.target.height === height ) return band.target;
    band.target?.dispose();
    band.renderer = renderer;
    const target = new THREE.WebGLRenderTarget( width, height, {
        type: THREE.HalfFloatType,
        depthBuffer: false,
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        colorSpace: THREE.LinearSRGBColorSpace,
    } );
    target.texture.mapping = THREE.EquirectangularReflectionMapping;
    band.target = target;
    band.source = null;
    return target;
}

export function bandedEnvironment( renderer: THREE.WebGLRenderer, source: THREE.Texture | null ): THREE.Texture | null {
    const intensity = num( 'Environment.bandIntensity' );
    if ( source === null || ! ( intensity > 0 ) ) return source;

    const image = source.image as { width: number; height: number };
    const target = targetFor( renderer, image.width, image.height );
    const color = col( 'Accent.color' );
    const height = num( 'Environment.bandHeight' );
    if ( band.source === source && band.color === color && band.intensity === intensity && band.height === height ) {
        return target.texture;
    }

    band.source = source;
    band.color = color;
    band.intensity = intensity;
    band.height = height;
    material.uniforms.hdri.value = source;
    material.uniforms.bandColor.value.set( color ).multiplyScalar( intensity );
    material.uniforms.halfHeight.value = THREE.MathUtils.degToRad( height / 2 );

    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget( target );
    quad.render( renderer );
    renderer.setRenderTarget( previous );
    target.texture.needsPMREMUpdate = true;
    return target.texture;
}
