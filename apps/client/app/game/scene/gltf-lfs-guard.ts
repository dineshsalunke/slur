// Git-LFS pointer guard for GLTF loads (#65, part 2 of #39).
//
// The ship .gltf files are LFS-tracked (.gitattributes). A clone without `git lfs pull` leaves a ~130-byte
// ASCII pointer file on disk where the model should be; Vite serves it happily, GLTFLoader JSON.parses it,
// and the developer gets `Unexpected token 'v'` — the 'v' of `version https://git-lfs.github.com/spec/v1`.
//
// MECHANISM (non-negotiable #14 — options weighed before choosing):
//   1. DOM error boundary above each <Canvas> that re-reads the URL and sniffs on catch — 2 new components,
//      2 mount points, and it only runs AFTER the confusing error already happened.
//   2. Route `clientLoader` preflight `fetch` of one model URL — central, but a real extra request on every
//      happy-path navigation, and it only covers routes (module-scope `useGLTF.preload` fires regardless).
//   3. drei `<Html>` inside the Canvas — still needs a boundary to trigger it, and puts DOM in the R3F tree.
//   4. Vite dev middleware / build-time check — dev-server only, dead in a preview or deployed build.
//   5. drei `useGLTF`'s `extendLoader` hook (4th arg, typed `(loader: GLTFLoader) => void`) — wrap
//      `loader.parse` and reject the pointer bytes BEFORE three ever parses them.  ← CHOSEN
// (5) wins on every axis that matters here: ZERO render-tree surface (no component, no boundary, no
// subscription, no per-frame work — non-negotiable #4 is untouched), zero extra network requests, and the
// bytes it inspects are already in memory. It also replaces the raw error at the source rather than
// translating it after the fact, so the message is right in the console, in the dev overlay, and in any
// error boundary added later.
//
// Verified against the installed stack (non-negotiable #13):
//   • drei 10.7.8 `useGLTF(path, useDraco, useMeshopt, extendLoader)` — `ExtendLoader = (loader: GLTFLoader)
//     => void`, applied to the loader before every `load()` (core/Gltf.d.ts).
//   • R3F 9.7.0 `useLoader` memoizes ONE loader instance per constructor and re-applies the extension on
//     every load — hence the idempotency guard below.
//   • three-stdlib GLTFLoader wraps `parse()` in try/catch and routes a throw to its `onError`, which R3F
//     turns into `Could not load <url>: <our message>` — so the URL comes back for free and this module
//     never needs to know it.

// A pointer file always opens with the spec version line; nothing else served as a model can.
const POINTER_PREFIX = 'version https://git-lfs';

export const LFS_POINTER_HINT =
    'Ship models are Git-LFS-tracked and this clone has the pointer file, not the model. ' +
    'Run `git lfs install && git lfs pull` in the repo root, then reload.';

// Structural loader shape — deliberately NOT `import type { GLTFLoader } from 'three-stdlib'`: three-stdlib
// is drei's dependency, not ours, and importing it here would be a phantom dependency.
interface GltfParsingLoader {
    parse(
        data: ArrayBuffer | string,
        path: string,
        onLoad: ( gltf: unknown ) => void,
        onError?: ( event: unknown ) => void,
    ): void;
}

/**
 * True when `data` is a Git-LFS pointer file rather than real model bytes. Bails on the first mismatching
 * byte, so a real `.gltf` (`{`) or `.glb` (`glTF` magic) costs exactly one comparison.
 */
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
