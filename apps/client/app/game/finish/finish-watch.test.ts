import { describe, expect, it } from 'vitest';
import { pickWatchTarget, type WatchRacer } from './finish-watch';

function racer( z: number, over: Partial< WatchRacer > = {} ): WatchRacer {
    return { finished: false, spectating: false, connected: true, z, ...over };
}

function field( entries: Record< string, WatchRacer > ): Map< string, WatchRacer > {
    return new Map( Object.entries( entries ) );
}

describe( 'pickWatchTarget', () => {
    it( 'picks the leading racer still running, never self', () => {
        const f = field( { self: racer( 900, { finished: true } ), a: racer( 400 ), b: racer( 600 ) } );
        expect( pickWatchTarget( f, 'self', null ) ).toBe( 'b' );
    } );

    it( 'skips finished, spectating and disconnected racers', () => {
        const f = field( {
            self: racer( 900, { finished: true } ),
            done: racer( 950, { finished: true } ),
            spec: racer( 800, { spectating: true } ),
            gone: racer( 700, { connected: false } ),
            a: racer( 100 ),
        } );
        expect( pickWatchTarget( f, 'self', null ) ).toBe( 'a' );
    } );

    it( 'holds the current target while it runs, even when overtaken', () => {
        const f = field( { self: racer( 900, { finished: true } ), a: racer( 400 ), b: racer( 600 ) } );
        expect( pickWatchTarget( f, 'self', 'a' ) ).toBe( 'a' );
    } );

    it( 're-picks the leader when the current target finishes', () => {
        const f = field( {
            self: racer( 900, { finished: true } ),
            a: racer( 910, { finished: true } ),
            b: racer( 600 ),
        } );
        expect( pickWatchTarget( f, 'self', 'a' ) ).toBe( 'b' );
    } );

    it( 'keeps the last target once nobody is left running', () => {
        const f = field( { self: racer( 900, { finished: true } ), a: racer( 910, { finished: true } ) } );
        expect( pickWatchTarget( f, 'self', 'a' ) ).toBe( 'a' );
    } );

    it( 'returns null when there was never anyone to watch', () => {
        expect( pickWatchTarget( field( { self: racer( 900, { finished: true } ) } ), 'self', null ) ).toBeNull();
    } );
} );
