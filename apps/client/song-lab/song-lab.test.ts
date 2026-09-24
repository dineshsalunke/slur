import { CELL, SCORE_LINE_LIMIT, SEG_LEN } from '@slur/shared';
import { describe, expect, test } from 'vitest';
import type { SongAnalysis } from '../tapper/beat-analysis.ts';
import {
    classTuning,
    expandInputs,
    labDigest,
    labEmitted,
    labResult,
    labStep,
    labTrack,
    newReplay,
    packInputs,
    replayRun,
    sameResult,
} from './bundle.ts';
import { GROOVE_VARIANTS } from './groove.ts';
import { gridStart, placeEvents, type SongEvent, songClock } from './map.ts';
import { mineMotifs } from './mine.ts';
import { TAP_TICKS } from './pilot.ts';
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

    test( 'the song clock starts where the recorded freighter first reaches cruise', () => {
        const c = songClock( song );
        const v = buildVariant( GROOVE_VARIANTS[ 0 ], song, 1, [ 'freighter' ] );
        const track = labTrack( v );
        const tuning = classTuning( 'freighter' );
        const r = newReplay();
        for ( const input of expandInputs( v.runs[ 0 ].inputs ) ) {
            labStep( r.ship, input, tuning, track, r.world, r.tally );
            if ( r.ship.vz >= tuning.maxCruise ) break;
        }
        expect( r.ship.z ).toBe( c.z0 );
        expect( c.t0 ).toBe( 0 );
        expect( v.score.notes[ 0 ].z ).toBeGreaterThanOrEqual( c.z0 );
    } );

    test( 'placed events sit back to back on the segment grid inside the line limit', () => {
        const c = songClock( song );
        const events: SongEvent[] = song.beats.map( ( t, i ) => ( {
            t,
            token: i % 3 === 0 ? 'J' : i % 2 === 0 ? 'l' : 'R',
            accent: false,
        } ) );
        const score = placeEvents( song, c, 1, events, new Array( c.length ).fill( 0.5 ) );
        let z = gridStart( c );
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

    test( 'the groove places the owner groove on backbeats and the hook tap jump is a short press', () => {
        const v = buildVariant( GROOVE_VARIANTS[ 1 ], song, 1, [ 'fighter', 'freighter' ] );
        expect( v.scoreString.replaceAll( '. ', '' ) ).toMatch( /^L R L R L R r l r l r r l r l / );
        expect( v.scoreString.replaceAll( '. ', '' ) ).toContain( 'J j' );
        for ( const run of v.runs ) {
            expect( run.result.deaths ).toBe( 0 );
            const presses: number[] = [];
            let held = 0;
            for ( const input of expandInputs( run.inputs ) ) {
                if ( input.jump ) held++;
                else if ( held > 0 ) {
                    presses.push( held );
                    held = 0;
                }
            }
            expect( presses ).toContain( TAP_TICKS );
        }
    } );

    test( 'an open variant replays from JSON and has far less wall than its corridor', () => {
        const spec = { ...GROOVE_VARIANTS[ 1 ], emit: 'open' as const };
        const v = buildVariant( spec, song, 1, [ 'comet' ], [ 'rookie' ] );
        const copy: typeof v = JSON.parse( JSON.stringify( v ) );
        expect( copy.emit ).toBe( 'open' );
        expect( labDigest( copy ) ).toBe( v.trackDigest );
        const track = labTrack( copy );
        for ( const run of [ ...copy.runs, ...( copy.humanRuns ?? [] ) ] ) {
            expect( sameResult( labResult( replayRun( track, run ) ), run.result ) ).toBe( true );
            expect( run.result.finished ).toBe( true );
        }
        const area = ( emit: 'open' | 'corridor' ) =>
            labEmitted( v.score, emit )
                .segments.flatMap( ( s ) => s.blocks )
                .reduce( ( n, b ) => n + ( b.x1 - b.x0 ) * ( b.z1 - b.z0 ), 0 );
        expect( area( 'open' ) ).toBeLessThan( area( 'corridor' ) / 4 );
    } );
} );
