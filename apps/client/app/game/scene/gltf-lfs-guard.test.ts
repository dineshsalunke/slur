import { describe, expect, it } from 'vitest';
import { guardLfsPointer, isLfsPointer, LFS_POINTER_HINT } from './gltf-lfs-guard';

// Exactly what git leaves on disk for an LFS-tracked file in a clone that never ran `git lfs pull`.
const POINTER_FILE = [
    'version https://git-lfs.github.com/spec/v1',
    'oid sha256:8f3c1d0a5e9b7c2f4a6d8e0b1c3f5a7d9e2b4c6f8a0d2e4b6c8f0a2d4e6b8c0f',
    'size 4307283',
    '',
].join( '\n' );

// The opening bytes of a real Quaternius ship .gltf (apps/client/public/models/ships/*.gltf).
const REAL_GLTF = '{\n    "asset" : {\n        "generator" : "Khronos glTF Blender I/O v1.5.17"\n    }\n}';

function bytes( text: string ): ArrayBuffer {
    return new TextEncoder().encode( text ).buffer as ArrayBuffer;
}

// Stands in for three-stdlib's GLTFLoader: `parse` JSON-decodes the ArrayBuffer (this is the exact step that
// yields `Unexpected token 'v'` on a pointer file), and `load` reproduces GLTFLoader.load's try/catch, which
// is what routes a throw out of `parse` into onError — the path R3F's useLoader turns into a suspense reject.
function makeLoader() {
    const parsed: string[] = [];
    const loader = {
        parse(
            data: ArrayBuffer | string,
            _path: string,
            onLoad: ( gltf: unknown ) => void,
            _onError?: ( event: unknown ) => void,
        ): void {
            const text = typeof data === 'string' ? data : new TextDecoder().decode( data );
            const json = JSON.parse( text ) as { asset?: unknown };
            parsed.push( text );
            onLoad( { scene: json } );
        },
    };
    const load = ( data: ArrayBuffer ): Error | undefined => {
        try {
            loader.parse( data, '/models/ships/', () => {}, undefined );
        } catch ( e ) {
            return e as Error;
        }
        return undefined;
    };
    return { loader, load, parsed };
}

describe( 'isLfsPointer', () => {
    it( 'recognises a pointer file as text and as bytes', () => {
        expect( isLfsPointer( POINTER_FILE ) ).toBe( true );
        expect( isLfsPointer( bytes( POINTER_FILE ) ) ).toBe( true );
    } );

    it( 'passes real model bytes and short/empty payloads through', () => {
        expect( isLfsPointer( REAL_GLTF ) ).toBe( false );
        expect( isLfsPointer( bytes( REAL_GLTF ) ) ).toBe( false );
        expect( isLfsPointer( bytes( 'glTF' ) ) ).toBe( false ); // .glb magic
        expect( isLfsPointer( bytes( '' ) ) ).toBe( false );
        expect( isLfsPointer( bytes( 'version 2' ) ) ).toBe( false ); // shares a prefix word, not the spec URL
    } );
} );

describe( 'guardLfsPointer', () => {
    it( 'replaces the raw JSON parse error with the git lfs pull hint', () => {
        const { loader, load } = makeLoader();
        guardLfsPointer( loader );
        const err = load( bytes( POINTER_FILE ) );
        expect( err?.message ).toBe( LFS_POINTER_HINT );
        expect( err?.message ).toMatch( /git lfs pull/ );
        expect( err?.message ).not.toMatch( /Unexpected token/ );
    } );

    it( 'is the ONLY thing that makes that message appear — an unguarded loader still throws JSON noise', () => {
        const { load } = makeLoader();
        const err = load( bytes( POINTER_FILE ) );
        expect( err?.message ).toMatch( /Unexpected token/ );
    } );

    it( 'leaves the real-model path untouched', () => {
        const { loader, load, parsed } = makeLoader();
        guardLfsPointer( loader );
        expect( load( bytes( REAL_GLTF ) ) ).toBeUndefined();
        expect( parsed ).toEqual( [ REAL_GLTF ] );
    } );

    it( 'is idempotent — R3F re-applies extendLoader on every load of the one memoized loader', () => {
        const { loader, load, parsed } = makeLoader();
        guardLfsPointer( loader );
        const first = loader.parse;
        guardLfsPointer( loader );
        guardLfsPointer( loader );
        expect( loader.parse ).toBe( first );
        expect( load( bytes( REAL_GLTF ) ) ).toBeUndefined();
        expect( parsed ).toEqual( [ REAL_GLTF ] );
    } );
} );
