import { CELL, SCORE_LINE_LIMIT, SEG_LEN } from '@slur/shared';
import { describe, expect, test } from 'vitest';
import type { SongAnalysis } from '../tapper/beat-analysis.ts';
import { expandInputs, labDigest, labResult, labTrack, packInputs, replayRun, sameResult } from './bundle.ts';
import { placeEvents, type SongEvent, songClock } from './map.ts';
import { mineMotifs } from './mine.ts';
import { buildVariant } from './song-lab-build.ts';
import { COMPOSE_VARIANTS } from './variants.ts';

const BPM = 120;
const BARS = 24;

const song: SongAnalysis = {
    song: 'synthetic',
    duration: ( BARS * 4 * 60 ) / BPM + 1,
    bpm: BPM,
    beatsPerBar: 4,
    firstBarBeat: 0,
    drums: { kick: [], snare: [], hats: [] },
    beats: Array.from( { length: BARS * 4 }, ( _, i ) => 0.5 + ( i * 60 ) / BPM ),
    bars: Array.from( { length: BARS }, ( _, i ) => 0.5 + ( i * 4 * 60 ) / BPM ),
    energy: Array.from( { length: BARS }, ( _, i ) => ( i < 8 ? 0.3 : i < 16 ? 0.9 : 0.5 ) ),
    sections: [
        { fromBar: 0, toBar: 8, label: 'low', energy: 0.3 },
        { fromBar: 8, toBar: 16, label: 'high', energy: 0.9 },
        { fromBar: 16, toBar: 24, label: 'mid', energy: 0.5 },
    ],
};

describe( 'song lab', () => {
    test( 'RLE inputs round-trip', () => {
        const inputs = [ 0, 0, 1, 1, 1, -1 ].map( ( strafe, seq ) => ( {
            seq,
            throttle: 1,
            brake: 0,
            strafe,
            jump: seq === 3,
        } ) );
        expect( expandInputs( packInputs( inputs ) ) ).toEqual( inputs );
    } );

    test( 'placed events sit back to back on the segment grid inside the line limit', () => {
        const c = songClock( song );
        const events: SongEvent[] = song.beats.map( ( t, i ) => ( {
            t,
            token: i % 3 === 0 ? 'J' : i % 2 === 0 ? 'l' : 'R',
            accent: false,
        } ) );
        const score = placeEvents( song, c, 1, events, new Array( c.length ).fill( 0.5 ) );
        let z = c.z0;
        for ( const n of score.notes ) {
            expect( n.z ).toBe( z );
            expect( n.z % SEG_LEN ).toBe( 0 );
            expect( Math.abs( n.x ) ).toBeLessThanOrEqual( SCORE_LINE_LIMIT );
            expect( Math.abs( n.x % CELL ) ).toBe( 0 );
            z += n.duration;
        }
        expect( score.notes.some( ( n ) => n.kind === 'jump' ) ).toBe( true );
        expect( mineMotifs( score ).length ).toBeGreaterThan( 0 );
    } );

    test( 'a recorded run replays to the same result from the bundle JSON alone', () => {
        const v = buildVariant( COMPOSE_VARIANTS[ 1 ], song, 3, [ 'freighter', 'interceptor' ] );
        const copy: typeof v = JSON.parse( JSON.stringify( v ) );
        expect( labDigest( copy ) ).toBe( v.trackDigest );
        const track = labTrack( copy );
        for ( const run of copy.runs ) {
            expect( sameResult( labResult( replayRun( track, run ) ), run.result ) ).toBe( true );
            expect( run.result.finished ).toBe( true );
        }
    } );

    test( 'human runs are seeded, replay from JSON and leave the perfect runs unchanged', () => {
        const spec = COMPOSE_VARIANTS[ 1 ];
        const perfect = buildVariant( spec, song, 3, [ 'fighter' ] );
        const a = buildVariant( spec, song, 3, [ 'fighter' ], [ 'club', 'rookie' ] );
        const b = buildVariant( spec, song, 3, [ 'fighter' ], [ 'club', 'rookie' ] );
        expect( a.runs ).toEqual( perfect.runs );
        expect( a.humanRuns ).toEqual( b.humanRuns );
        const copy: typeof a = JSON.parse( JSON.stringify( a ) );
        const track = labTrack( copy );
        expect( copy.humanRuns?.map( ( r ) => r.pilot.skill ) ).toEqual( [ 'club', 'rookie' ] );
        for ( const run of copy.humanRuns ?? [] )
            expect( sameResult( labResult( replayRun( track, run ) ), run.result ) ).toBe( true );
    } );
} );
