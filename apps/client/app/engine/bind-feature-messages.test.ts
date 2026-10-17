import { createWorld, type Entity } from 'koota';
import { describe, expect, it } from 'vitest';
import { bindFeatureMessages } from './bind-feature-messages';
import { defineClientFeature } from './define-client-feature';

function fakeRoom() {
    const handlers = new Map< string, ( payload: unknown ) => void >();
    return {
        handlers,
        sessionId: 'me',
        onMessage< Payload >( type: string, callback: ( payload: Payload ) => void ): () => void {
            handlers.set( type, callback as ( payload: unknown ) => void );
            return () => handlers.delete( type );
        },
    };
}

function noEntity(): Entity | undefined {
    return undefined;
}

describe( 'bindFeatureMessages (#385)', () => {
    it( 'subscribes every net handler and unsubscribes them all on off', () => {
        const got: number[] = [];
        const a = defineClientFeature( { id: 'a', net: { 'a.ping': ( n: number ) => got.push( n ) } } );
        const b = defineClientFeature( { id: 'b', net: { 'b.ping': ( n: number ) => got.push( n * 10 ) } } );
        const room = fakeRoom();
        const off = bindFeatureMessages( room, [ a, b ], noEntity );
        room.handlers.get( 'a.ping' )?.( 1 );
        room.handlers.get( 'b.ping' )?.( 2 );
        expect( got ).toEqual( [ 1, 20 ] );
        off();
        expect( room.handlers.size ).toBe( 0 );
    } );

    it( 'passes the local session id to every handler', () => {
        const seen: string[] = [];
        const a = defineClientFeature( { id: 'a', net: { ping: ( _n: number, net ) => seen.push( net.sessionId ) } } );
        const room = fakeRoom();
        bindFeatureMessages( room, [ a ], noEntity );
        room.handlers.get( 'ping' )?.( 1 );
        expect( seen ).toEqual( [ 'me' ] );
    } );

    it( 'resolves a session id to its entity through the lookup it was given (#405)', () => {
        const world = createWorld();
        const them = world.spawn();
        const seen: ( Entity | undefined )[] = [];
        const a = defineClientFeature( {
            id: 'a',
            net: { ping: ( sid: string, net ) => seen.push( net.entityOf( sid ) ) },
        } );
        const room = fakeRoom();
        bindFeatureMessages( room, [ a ], ( sid ) => ( sid === 'them' ? them : undefined ) );
        room.handlers.get( 'ping' )?.( 'them' );
        room.handlers.get( 'ping' )?.( 'nobody' );
        expect( seen ).toEqual( [ them, undefined ] );
        world.destroy();
    } );

    it( 'throws on a message type two features claim, before it subscribes any', () => {
        const a = defineClientFeature( { id: 'a', net: { ping: () => {} } } );
        const b = defineClientFeature( { id: 'b', net: { ping: () => {} } } );
        const room = fakeRoom();
        expect( () => bindFeatureMessages( room, [ a, b ], noEntity ) ).toThrow( 'message "ping" is taken by "a"' );
        expect( room.handlers.size ).toBe( 0 );
    } );

    it( 'binds nothing for features with no net slot', () => {
        const room = fakeRoom();
        bindFeatureMessages( room, [ defineClientFeature( { id: 'quiet' } ) ], noEntity );
        expect( room.handlers.size ).toBe( 0 );
    } );
} );
