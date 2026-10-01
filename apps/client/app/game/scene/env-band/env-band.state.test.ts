import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { bandedEnvironment } from './env-band.state';

function stubRenderer() {
    const calls = { render: 0 };
    const renderer = {
        getRenderTarget: () => null,
        setRenderTarget: () => {},
        render: () => {
            calls.render++;
        },
    } as unknown as THREE.WebGLRenderer;
    return { renderer, calls };
}

function source(): THREE.Texture {
    return new THREE.DataTexture( new Float32Array( 8 * 4 * 4 ), 8, 4, THREE.RGBAFormat, THREE.FloatType );
}

describe( 'banded environment', () => {
    it( 'draws once per renderer and reuses the band while nothing changes', () => {
        const hdri = source();
        const a = stubRenderer();
        const first = bandedEnvironment( a.renderer, hdri );
        expect( bandedEnvironment( a.renderer, hdri ) ).toBe( first );
        expect( a.calls.render ).toBe( 1 );
    } );

    it( 'redraws the band into a new target when the renderer changes', () => {
        const hdri = source();
        const a = stubRenderer();
        const b = stubRenderer();
        const old = bandedEnvironment( a.renderer, hdri );
        let disposed = false;
        ( old as THREE.Texture & { renderTarget: THREE.RenderTarget } ).renderTarget.addEventListener(
            'dispose',
            () => {
                disposed = true;
            },
        );
        const next = bandedEnvironment( b.renderer, hdri );
        expect( b.calls.render ).toBe( 1 );
        expect( next ).not.toBe( old );
        expect( disposed ).toBe( true );
    } );
} );
