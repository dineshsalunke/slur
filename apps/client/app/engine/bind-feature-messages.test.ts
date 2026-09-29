import { describe, expect, it } from 'vitest';
import { bindFeatureMessages } from './bind-feature-messages';
import { defineClientFeature } from './define-client-feature';

function fakeRoom() {
    const handlers = new Map< string, ( payload: unknown ) => void >();
    return {
        handlers,
        onMessage< Payload >( type: string, callback: ( payload: Payload ) => void ): () => void {
            handlers.set( type, callback as ( payload: unknown ) => void );
            return () => handlers.delete( type );
        },
    };
}

describe( 'bindFeatureMessages (#385)', () => {
    it( 'subscribes every net handler and unsubscribes them all on off', () => {
        const got: number[] = [];
        const a = defineClientFeature( { id: 'a', net: { 'a.ping': ( n: number ) => got.push( n ) } } );
        const b = defineClientFeature( { id: 'b', net: { 'b.ping': ( n: number ) => got.push( n * 10 ) } } );
        const room = fakeRoom();
        const off = bindFeatureMessages( room, [ a, b ] );
        room.handlers.get( 'a.ping' )?.( 1 );
        room.handlers.get( 'b.ping' )?.( 2 );
        expect( got ).toEqual( [ 1, 20 ] );
        off();
        expect( room.handlers.size ).toBe( 0 );
    } );

    it( 'throws on a message type two features claim, before it subscribes any', () => {
        const a = defineClientFeature( { id: 'a', net: { ping: () => {} } } );
        const b = defineClientFeature( { id: 'b', net: { ping: () => {} } } );
        const room = fakeRoom();
        expect( () => bindFeatureMessages( room, [ a, b ] ) ).toThrow( 'message "ping" is taken by "a"' );
        expect( room.handlers.size ).toBe( 0 );
    } );

    it( 'binds nothing for features with no net slot', () => {
        const room = fakeRoom();
        bindFeatureMessages( room, [ defineClientFeature( { id: 'quiet' } ) ] );
        expect( room.handlers.size ).toBe( 0 );
    } );
} );
