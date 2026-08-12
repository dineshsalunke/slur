// @vitest-environment jsdom

import ReactThreeTestRenderer from '@react-three/test-renderer';
import { createWorld } from 'koota';
import { WorldProvider } from 'koota/react';
import type * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { Track } from './track';

// GPU-leak regression for #88. The grid texture is `new`'d by hand in a useMemo, so R3F does NOT own it, and
// three's `deallocateMaterial` releases only program references — never the material's textures (verified in
// three 0.185.1). Only `texture.dispose()` frees the GPU allocation.
//
// We assert through three's OWN teardown signal — `Texture.dispose()` dispatches a `dispose` event, which is
// exactly what WebGLRenderer listens to in order to free the allocation — rather than spying on the method.
// A spy would still pass if the texture were swapped for a look-alike; the event is the real contract.

// jsdom ships no 2D canvas backend, so `getContext('2d')` returns null and makeGridTexture would throw. Stub
// ONLY the '2d' path — the test renderer asks the same prototype for its WebGL context and must not be broken.
beforeAll( () => {
    const real = HTMLCanvasElement.prototype.getContext;
    const ctx2d = {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        fillRect: () => {},
        strokeRect: () => {},
    };
    HTMLCanvasElement.prototype.getContext = function ( this: HTMLCanvasElement, type: string, ...rest: unknown[] ) {
        if ( type === '2d' ) return ctx2d;
        return ( real as ( ...a: unknown[] ) => unknown ).call( this, type, ...rest );
    } as typeof HTMLCanvasElement.prototype.getContext;
} );

function renderTrack() {
    return ReactThreeTestRenderer.create(
        <WorldProvider world={ createWorld() }>
            <Track />
        </WorldProvider>,
    );
}

// Both leapfrog planes must be painted by ONE texture instance — that is what makes a single dispose correct.
function gridTexture( renderer: Awaited< ReturnType< typeof renderTrack > > ): THREE.Texture {
    const meshes = renderer.scene.findAllByType( 'Mesh' );
    expect( meshes ).toHaveLength( 2 );
    const materials = meshes.map( ( m ) => ( m.instance as THREE.Mesh ).material as THREE.MeshStandardMaterial );
    const tex = materials[ 0 ].map;
    if ( ! tex ) throw new Error( 'track: expected a grid texture on the floor material' );
    expect( materials[ 1 ].map ).toBe( tex ); // shared across both planes
    expect( materials[ 0 ].emissiveMap ).toBe( tex ); // and reused as the emissive map
    return tex;
}

// Count three's own dispose event instead of patching the method.
function watchDisposals( tex: THREE.Texture ): () => number {
    let count = 0;
    tex.addEventListener( 'dispose', () => {
        count += 1;
    } );
    return () => count;
}

describe( 'Track grid texture disposal', () => {
    it( 'disposes the hand-rolled CanvasTexture exactly once on unmount', async () => {
        const renderer = await renderTrack();
        const tex = gridTexture( renderer );
        const disposals = watchDisposals( tex );

        expect( disposals() ).toBe( 0 ); // still mounted and in use — must NOT be released yet

        await renderer.unmount();

        expect( disposals() ).toBe( 1 ); // released once — not zero (the leak), not twice (double-dispose)
    } );

    it( 'keeps the texture alive across a re-render while it is still in use', async () => {
        const renderer = await renderTrack();
        const tex = gridTexture( renderer );
        const disposals = watchDisposals( tex );

        // Re-render the same element type: the memo holds, so the effect must NOT re-run and free a live texture.
        await renderer.update(
            <WorldProvider world={ createWorld() }>
                <Track />
            </WorldProvider>,
        );

        expect( disposals() ).toBe( 0 );
        expect( gridTexture( renderer ) ).toBe( tex ); // same instance still painting the floor

        await renderer.unmount();
        expect( disposals() ).toBe( 1 );
    } );
} );
