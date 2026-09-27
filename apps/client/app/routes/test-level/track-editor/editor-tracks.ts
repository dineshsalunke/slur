import {
    type AuthoredLevel,
    authoredLevel,
    decompileTrack,
    isLevelSlug,
    parseAuthoredLevel,
    resolveTrack,
} from '@slur/shared';
import { genOf, seedOf, testLevelDescriptor } from '../test-level-canvas/test-level-canvas.utils';

export interface SavedTrack {
    id: string;
    name: string;
}

async function fetchLevel( id: string ): Promise< AuthoredLevel | undefined > {
    const res = await fetch( `/__tracks/${ id }` );
    return res.ok ? parseAuthoredLevel( await res.json() ) : undefined;
}

export async function editorSource( params: URLSearchParams ): Promise< AuthoredLevel > {
    const id = params.get( 'level' );
    if ( isLevelSlug( id ) ) {
        const level = authoredLevel( id ) ?? ( await fetchLevel( id ) );
        if ( level !== undefined ) return level;
    }
    const gen = genOf( params.get( 'gen' ) );
    const seed = seedOf( params.get( 'seed' ) );
    const name = `${ gen }-${ seed }`;
    return decompileTrack( resolveTrack( testLevelDescriptor( gen, seed ) ), {
        id: name,
        name,
        source: { gen, seed },
    } );
}

function savedTrack( v: unknown ): SavedTrack | null {
    if ( typeof v === 'string' ) return { id: v, name: v };
    if ( typeof v !== 'object' || v === null ) return null;
    const { id, name } = v as { id?: unknown; name?: unknown };
    return typeof id === 'string' ? { id, name: typeof name === 'string' ? name : id } : null;
}

export async function savedTracks(): Promise< SavedTrack[] > {
    const res = await fetch( '/__tracks' ).catch( () => null );
    if ( res === null || ! res.ok ) return [];
    const body: unknown = await res.json().catch( () => null );
    const rows = Array.isArray( body ) ? body : ( ( body as { tracks?: unknown } | null )?.tracks ?? [] );
    return Array.isArray( rows ) ? rows.map( savedTrack ).filter( ( t ) => t !== null ) : [];
}
