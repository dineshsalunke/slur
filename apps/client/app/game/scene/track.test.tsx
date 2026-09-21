// @vitest-environment jsdom

import ReactThreeTestRenderer from '@react-three/test-renderer';
import { createWorld } from 'koota';
import { WorldProvider } from 'koota/react';
import type * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { Track } from './track';

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

function gridTexture( renderer: Awaited< ReturnType< typeof renderTrack > > ): THREE.Texture {
    const meshes = renderer.scene.findAllByType( 'Mesh' );
    expect( meshes ).toHaveLength( 2 );
    const materials = meshes.map( ( m ) => ( m.instance as THREE.Mesh ).material as THREE.MeshStandardMaterial );
    const tex = materials[ 0 ].map;
    if ( ! tex ) throw new Error( 'track: expected a grid texture on the floor material' );
    expect( materials[ 1 ].map ).toBe( tex );
    expect( materials[ 0 ].emissiveMap ).toBe( tex );
    return tex;
}

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

        expect( disposals() ).toBe( 0 );

        await renderer.unmount();

        expect( disposals() ).toBe( 1 );
    } );

    it( 'keeps the texture alive across a re-render while it is still in use', async () => {
        const renderer = await renderTrack();
        const tex = gridTexture( renderer );
        const disposals = watchDisposals( tex );

        await renderer.update(
            <WorldProvider world={ createWorld() }>
                <Track />
            </WorldProvider>,
        );

        expect( disposals() ).toBe( 0 );
        expect( gridTexture( renderer ) ).toBe( tex );

        await renderer.unmount();
        expect( disposals() ).toBe( 1 );
    } );
} );
