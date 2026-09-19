// Git-LFS pointer guard for GLTF loads. The ship .gltf files are LFS-tracked, so a clone without
// `git lfs pull` leaves a ~130-byte ASCII pointer where the model should be; Vite serves it, GLTFLoader
// JSON.parses it, and the developer gets `Unexpected token 'v'` — the 'v' of `version https://git-lfs…`.
//
// Hooked through drei's `extendLoader` rather than an error boundary or a preflight fetch, so it rejects the
// bytes before three parses them: no render-tree surface, no extra request, and the real message reaches the
// console and the dev overlay instead of a translation of it.

// A pointer file always opens with the spec version line; nothing else served as a model can.
const POINTER_PREFIX = 'version https://git-lfs';

export const LFS_POINTER_HINT =
    'Ship models are Git-LFS-tracked and this clone has the pointer file, not the model. ' +
    'Run `git lfs install && git lfs pull` in the repo root, then reload.';

// Structural shape, deliberately not `import type { GLTFLoader } from 'three-stdlib'` — three-stdlib is
// drei's dependency, not ours, so importing it here would be a phantom dependency.
interface GltfParsingLoader {
    parse(
        data: ArrayBuffer | string,
        path: string,
        onLoad: ( gltf: unknown ) => void,
        onError?: ( event: unknown ) => void,
    ): void;
}

/** True when `data` is a Git-LFS pointer rather than model bytes. A real `.gltf` or `.glb` fails on byte 0. */
export function isLfsPointer( data: ArrayBuffer | string ): boolean {
    if ( typeof data === 'string' ) return data.startsWith( POINTER_PREFIX );
    if ( data.byteLength < POINTER_PREFIX.length ) return false;
    const head = new Uint8Array( data, 0, POINTER_PREFIX.length );
    for ( let i = 0; i < POINTER_PREFIX.length; i++ ) {
        if ( head[ i ] !== POINTER_PREFIX.charCodeAt( i ) ) return false;
    }
    return true;
}

const guarded = new WeakSet< GltfParsingLoader >();

/** `extendLoader` for `useGLTF` / `useGLTF.preload`. Idempotent — the loader instance is a shared singleton. */
export function guardLfsPointer( loader: GltfParsingLoader ): void {
    if ( guarded.has( loader ) ) return;
    guarded.add( loader );
    const parse = loader.parse.bind( loader );
    loader.parse = ( data, path, onLoad, onError ) => {
        if ( isLfsPointer( data ) ) throw new Error( LFS_POINTER_HINT );
        parse( data, path, onLoad, onError );
    };
}
