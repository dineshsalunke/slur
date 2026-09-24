import { describe, expect, it } from 'vitest';
import { ANALYSIS_SR, analyzePcm } from './beat-analysis';
import { beatPosition, type DrumOnset } from './drum-onsets';

type Hit = 'kick' | 'snare' | 'hat';

function noise( seed: number ): () => number {
    let s = seed >>> 0;
    return () => {
        s = ( s * 1664525 + 1013904223 ) >>> 0;
        return ( s / 2 ** 32 ) * 2 - 1;
    };
}

function voice( hit: Hit, pcm: Float32Array, start: number, rand: () => number ): void {
    let phase = 0;
    let prev = 0;
    for ( let i = 0; i < ANALYSIS_SR * 0.25 && start + i < pcm.length; i++ ) {
        const x = i / ANALYSIS_SR;
        if ( hit === 'kick' ) {
            phase += ( 2 * Math.PI * ( 50 + 100 * Math.exp( -x / 0.03 ) ) ) / ANALYSIS_SR;
            pcm[ start + i ] += Math.sin( phase ) * Math.exp( -x / 0.15 ) + ( i < 40 ? 0.1 * rand() : 0 );
        } else if ( hit === 'snare' ) {
            const body = 0.4 * Math.sin( 2 * Math.PI * 200 * x ) * Math.exp( -x / 0.08 );
            pcm[ start + i ] += 0.5 * rand() * Math.exp( -x / 0.1 ) + body;
        } else {
            const n = rand();
            pcm[ start + i ] += 0.25 * ( n - prev ) * Math.exp( -x / 0.03 );
            prev = n;
        }
    }
}

function drumTrack( bpm: number, hats: boolean ): { pcm: Float32Array; truth: Record< Hit, number[] > } {
    const seconds = 30;
    const pcm = new Float32Array( seconds * ANALYSIS_SR );
    const rand = noise( 7 );
    const truth: Record< Hit, number[] > = { kick: [], snare: [], hat: [] };
    const eighth = 30 / bpm;
    for ( let k = 0, t = 0.3; t < seconds - 0.3; k++, t += eighth ) {
        const hits: Hit[] = [];
        if ( k % 4 === 0 ) hits.push( 'kick' );
        if ( k % 8 === 2 || k % 8 === 6 ) hits.push( 'snare' );
        if ( hats ) hits.push( 'hat' );
        for ( const h of hits ) {
            truth[ h ].push( t );
            voice( h, pcm, Math.round( t * ANALYSIS_SR ), rand );
        }
    }
    return { pcm, truth };
}

function matched( found: DrumOnset[], truth: number[] ): { hits: number; false: number } {
    const near = ( a: number, b: number ) => Math.abs( a - b ) < 0.035;
    return {
        hits: truth.filter( ( t ) => found.some( ( o ) => near( o.t, t ) ) ).length,
        false: found.filter( ( o ) => ! truth.some( ( t ) => near( o.t, t ) ) ).length,
    };
}

describe( 'drum onsets', () => {
    it.each( [ 96, 125, 140 ] )( 'splits kick on 1+3 and snare on 2+4 at %i BPM', ( bpm ) => {
        const { pcm, truth } = drumTrack( bpm, false );
        const { drums } = analyzePcm( 'kit', pcm );
        expect( matched( drums.kick, truth.kick ) ).toEqual( { hits: truth.kick.length, false: 0 } );
        expect( matched( drums.snare, truth.snare ) ).toEqual( { hits: truth.snare.length, false: 0 } );
        expect( drums.hats ).toEqual( [] );
    } );

    it( 'keeps kick and snare exact under eighth-note hats and finds only real hats', () => {
        const { pcm, truth } = drumTrack( 125, true );
        const { drums } = analyzePcm( 'kit', pcm );
        expect( matched( drums.kick, truth.kick ) ).toEqual( { hits: truth.kick.length, false: 0 } );
        expect( matched( drums.snare, truth.snare ) ).toEqual( { hits: truth.snare.length, false: 0 } );
        const hats = matched( drums.hats, truth.hat );
        expect( hats.false ).toBe( 0 );
        expect( hats.hits ).toBeGreaterThan( truth.hat.length / 3 );
    } );

    it( 'places kick and snare two beats apart inside each bar', () => {
        const { pcm } = drumTrack( 125, false );
        const a = analyzePcm( 'kit', pcm );
        const slots = ( on: DrumOnset[] ) =>
            new Set( on.filter( ( o ) => o.bar >= 0 ).map( ( o ) => Math.round( o.inBar ) % 4 ) );
        const kick = [ ...slots( a.drums.kick ) ].sort();
        const snare = [ ...slots( a.drums.snare ) ].sort();
        expect( kick ).toHaveLength( 2 );
        expect( kick[ 1 ] - kick[ 0 ] ).toBe( 2 );
        expect( snare.map( ( s ) => ( s + 1 ) % 4 ).sort() ).toEqual( kick );
        for ( const o of a.drums.kick ) {
            expect( o.inBar ).toBeGreaterThanOrEqual( 0 );
            expect( o.inBar ).toBeLessThan( 4 );
            expect( Math.abs( o.beat - ( a.firstBarBeat + 4 * o.bar + o.inBar ) ) ).toBeLessThan( 0.002 );
        }
    } );

    it( 'interpolates and extrapolates beat positions', () => {
        const beats = [ 1, 1.5, 2 ];
        expect( beatPosition( beats, 120, 1.25 ) ).toBeCloseTo( 0.5, 9 );
        expect( beatPosition( beats, 120, 0.5 ) ).toBeCloseTo( -1, 9 );
        expect( beatPosition( beats, 120, 3 ) ).toBeCloseTo( 4, 9 );
    } );
} );
