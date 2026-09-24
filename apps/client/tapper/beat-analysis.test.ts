import { describe, expect, it } from 'vitest';
import { ANALYSIS_SR, analyzePcm, fitBpm, sections } from './beat-analysis';

function clickTrack( bpm: number, seconds: number, accentEvery: number, offset: number ): Float32Array {
    const pcm = new Float32Array( Math.round( seconds * ANALYSIS_SR ) );
    const beat = 60 / bpm;
    for ( let k = 0, t = offset; t < seconds - 0.05; k++, t += beat ) {
        const amp = k % accentEvery === 0 ? 1 : 0.4;
        const start = Math.round( t * ANALYSIS_SR );
        for ( let i = 0; i < 400 && start + i < pcm.length; i++ ) {
            pcm[ start + i ] = amp * Math.sin( ( 2 * Math.PI * 1500 * i ) / ANALYSIS_SR ) * Math.exp( -i / 80 );
        }
    }
    return pcm;
}

describe( 'beat analysis', () => {
    it.each( [ 96, 125, 140 ] )( 'finds %i BPM on a click track', ( bpm ) => {
        const a = analyzePcm( 'click', clickTrack( bpm, 30, 4, 0.3 ) );
        expect( Math.abs( a.bpm - bpm ) ).toBeLessThan( 0.5 );
        const beat = 60 / bpm;
        const drift = a.beats.map( ( t ) => Math.abs( ( ( t - 0.3 + beat / 2 ) % beat ) - beat / 2 ) );
        expect( Math.max( ...drift ) ).toBeLessThan( 0.03 );
    } );

    it( 'puts bar lines on the accented beat', () => {
        const bpm = 120;
        const a = analyzePcm( 'click', clickTrack( bpm, 30, 4, 0.3 ) );
        const bar = ( 4 * 60 ) / bpm;
        for ( const t of a.bars ) {
            const off = ( t - 0.3 ) / bar;
            expect( Math.abs( off - Math.round( off ) ) ).toBeLessThan( 0.03 );
        }
    } );

    it( 'fits BPM from beat times', () => {
        expect( fitBpm( [ 0, 0.48, 0.96, 1.44 ] ) ).toBeCloseTo( 125, 6 );
    } );

    it( 'merges equal-tier bars into sections', () => {
        const energy = [ 0.1, 0.1, 0.1, 0.1, 0.5, 0.5, 0.5, 0.5, 1, 1, 1, 1, 1, 1, 1, 1 ];
        expect( sections( energy ).map( ( s ) => [ s.fromBar, s.toBar, s.label ] ) ).toEqual( [
            [ 0, 4, 'low' ],
            [ 4, 8, 'mid' ],
            [ 8, 16, 'high' ],
        ] );
    } );
} );
