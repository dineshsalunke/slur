import { describe, expect, it } from 'vitest';
import { createEventQueue } from './event-queue';

describe( 'createEventQueue', () => {
    it( 'drains in push order and empties the queue', () => {
        const q = createEventQueue< number >( 4 );
        q.push( 1 );
        q.push( 2 );
        const out: number[] = [];
        q.drain( ( e ) => out.push( e ) );
        expect( out ).toEqual( [ 1, 2 ] );
        expect( q.items ).toEqual( [] );
    } );

    it( 'drops the oldest event past the cap', () => {
        const q = createEventQueue< number >( 3 );
        for ( let i = 1; i <= 5; i++ ) q.push( i );
        expect( q.items ).toEqual( [ 3, 4, 5 ] );
    } );

    it( 'clear empties without a sink', () => {
        const q = createEventQueue< number >( 2 );
        q.push( 1 );
        q.clear();
        expect( q.items.length ).toBe( 0 );
    } );
} );
