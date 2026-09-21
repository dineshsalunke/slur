const POINTER_PREFIX = 'version https://git-lfs';

export const LFS_POINTER_HINT =
    'Ship models are Git-LFS-tracked and this clone has the pointer file, not the model. ' +
    'Run `git lfs install && git lfs pull` in the repo root, then reload.';

interface GltfParsingLoader {
    parse(
        data: ArrayBuffer | string,
        path: string,
        onLoad: ( gltf: unknown ) => void,
        onError?: ( event: unknown ) => void,
    ): void;
}

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

export function guardLfsPointer( loader: GltfParsingLoader ): void {
    if ( guarded.has( loader ) ) return;
    guarded.add( loader );
    const parse = loader.parse.bind( loader );
    loader.parse = ( data, path, onLoad, onError ) => {
        if ( isLfsPointer( data ) ) throw new Error( LFS_POINTER_HINT );
        parse( data, path, onLoad, onError );
    };
}
