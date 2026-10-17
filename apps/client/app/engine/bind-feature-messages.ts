import type { Entity } from 'koota';
import type { RunRoomLike } from '../net/run-room-like';
import type { ClientFeature, NetContext } from './define-client-feature';

export function bindFeatureMessages(
    room: Pick< RunRoomLike, 'onMessage' | 'sessionId' >,
    features: readonly ClientFeature[],
    entityOf: ( sessionId: string ) => Entity | undefined,
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
    const net: NetContext = { sessionId: room.sessionId, entityOf };
    for ( const f of features ) {
        for ( const [ type, on ] of Object.entries( f.net ?? {} ) ) {
            offs.push( room.onMessage( type, ( payload: never ) => on( payload, net ) ) );
        }
    }
    return () => {
        for ( const off of offs ) off();
    };
}
