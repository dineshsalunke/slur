import type { RunRoomLike } from '../net/run-room-like';
import type { ClientFeature } from './define-client-feature';

export function bindFeatureMessages(
    room: Pick< RunRoomLike, 'onMessage' >,
    features: readonly ClientFeature[],
): () => void {
    const owners = new Map< string, string >();
    const offs: ( () => void )[] = [];
    for ( const f of features ) {
        for ( const type of Object.keys( f.net ?? {} ) ) {
            const owner = owners.get( type );
            if ( owner ) throw new Error( `feature "${ f.id }": message "${ type }" is taken by "${ owner }"` );
            owners.set( type, f.id );
        }
    }
    for ( const f of features ) {
        for ( const [ type, on ] of Object.entries( f.net ?? {} ) ) offs.push( room.onMessage( type, on ) );
    }
    return () => {
        for ( const off of offs ) off();
    };
}
