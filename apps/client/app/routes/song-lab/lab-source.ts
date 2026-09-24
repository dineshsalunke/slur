import type { LabBundle } from '../../../song-lab/bundle';

const bundles = new Map< string, Promise< LabBundle > >();

async function getJson< T >( url: string ): Promise< T > {
    const res = await fetch( url );
    if ( ! res.ok ) throw new Error( `${ url }: ${ res.status } ${ await res.text() }` );
    return ( await res.json() ) as T;
}

export function listBundles(): Promise< string[] > {
    return getJson( '/__song-lab/list' );
}

export function fetchBundle( name: string ): Promise< LabBundle > {
    let p = bundles.get( name );
    if ( ! p ) {
        p = getJson< LabBundle >( `/__song-lab/bundle?name=${ encodeURIComponent( name ) }` );
        p.catch( () => bundles.delete( name ) );
        bundles.set( name, p );
    }
    return p;
}

export function forgetBundles(): void {
    bundles.clear();
}
