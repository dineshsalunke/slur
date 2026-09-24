import { describe, expect, it } from 'vitest';
import { barTime, type Grid, gridAt } from './song-grid';
import { nextTake, placeNotes, type TapNote } from './take-model';
import { createGestures } from './tap-gestures';

const grid: Grid = {
    bpm: 120,
    beatsPerBar: 4,
    beats: Array.from( { length: 40 }, ( _, i ) => 1 + i * 0.5 ),
    bars: Array.from( { length: 10 }, ( _, i ) => 1.5 + i * 2 ),
};

describe( 'song grid', () => {
    it( 'places a time on beat and bar, honouring the bar phase', () => {
        expect( gridAt( grid, 1.5 ) ).toEqual( { beat: 1, bar: 0, beatInBar: 0 } );
        expect( gridAt( grid, 4.25 ) ).toEqual( { beat: 6.5, bar: 1, beatInBar: 1.5 } );
        expect( barTime( grid, 3 ) ).toBe( 7.5 );
        expect( barTime( grid, 12 ) ).toBe( 25.5 );
    } );
} );

describe( 'tap gestures', () => {
    const down = ( code: string, t: number, ms = t * 1000, shift = false ) => ( { code, shift, down: true, t, ms } );
    const up = ( code: string, t: number ) => ( { code, shift: false, down: false, t, ms: t * 1000 } );

    it( 'maps taps, shifted taps, holds, jumps and smash', () => {
        const g = createGestures( 0.5 );
        g.feed( down( 'KeyA', 1 ) );
        g.feed( up( 'KeyA', 1.1 ) );
        g.feed( down( 'KeyD', 2, 2000, true ) );
        g.feed( up( 'KeyD', 2.1 ) );
        g.feed( down( 'KeyA', 3 ) );
        g.feed( up( 'KeyA', 3.7 ) );
        g.feed( down( 'Space', 4 ) );
        g.feed( down( 'KeyS', 5 ) );
        expect( g.notes().map( ( n ) => n.token ) ).toEqual( [ 'l', 'R', '<', 'J', 'S' ] );
        expect( g.notes()[ 2 ].held ).toBeCloseTo( 0.7 );
    } );

    it( 'merges a quick second jump into JJ, but not a slow one', () => {
        const g = createGestures( 0.5 );
        g.feed( down( 'Space', 1, 1000 ) );
        g.feed( down( 'Space', 1.1, 1200 ) );
        g.feed( down( 'Space', 3, 3000 ) );
        g.feed( down( 'Space', 3.5, 3400 ) );
        expect( g.notes().map( ( n ) => n.token ) ).toEqual( [ 'JJ', 'J', 'J' ] );
    } );

    it( 'flushes a key still held when the take ends', () => {
        const g = createGestures( 0.5 );
        g.feed( down( 'KeyD', 1 ) );
        g.flush( 2 );
        expect( g.notes() ).toEqual( [ { t: 1, token: '>', held: 1 } ] );
    } );
} );

describe( 'takes', () => {
    const note = ( t: number ): TapNote => placeNotes( grid, [ { t, token: 'l' } ], 0 )[ 0 ];

    it( 'punch-in replaces only the bars inside the range', () => {
        const first = nextTake( [], null, 'song', [ 1.6, 3.6, 5.6, 7.6 ].map( note ), {
            fromBar: 0,
            toBar: 4,
            rate: 1,
        } );
        const fresh = [ note( 4 ) ];
        const second = nextTake( [ first ], first, 'song', fresh, { fromBar: 1, toBar: 3, rate: 0.5 } );
        expect( second.id ).toBe( 2 );
        expect( second.base ).toBe( 1 );
        expect( second.notes.map( ( n ) => n.t ) ).toEqual( [ 1.6, 4, 7.6 ] );
        expect( first.notes ).toHaveLength( 4 );
    } );

    it( 'pins an early first tap to the first bar of the range', () => {
        const [ n ] = placeNotes( grid, [ { t: 3.4, token: 'J' } ], 1 );
        expect( n.bar ).toBe( 1 );
        expect( n.beatInBar ).toBeCloseTo( -0.2 );
    } );
} );
