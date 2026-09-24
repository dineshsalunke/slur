import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { ANALYSIS_SR, analyzePcm } from './beat-analysis.ts';

export function decodeMono( file: string ): Promise< Float32Array > {
    return new Promise( ( ok, fail ) => {
        const args = [ '-v', 'error', '-i', file, '-ac', '1', '-ar', String( ANALYSIS_SR ), '-f', 'f32le', '-' ];
        const ff = spawn( 'ffmpeg', args );
        const chunks: Buffer[] = [];
        ff.stdout.on( 'data', ( c: Buffer ) => chunks.push( c ) );
        ff.stderr.pipe( process.stderr );
        ff.on( 'error', fail );
        ff.on( 'close', ( code ) => {
            if ( code !== 0 ) return fail( new Error( `ffmpeg exited ${ code }` ) );
            const buf = Buffer.concat( chunks );
            ok( new Float32Array( buf.buffer.slice( buf.byteOffset, buf.byteOffset + buf.byteLength ) ) );
        } );
    } );
}

const [ file, out ] = process.argv.slice( 2 );
if ( ! file ) {
    console.error( 'usage: pnpm --filter @slur/client beat-analysis <song.mp3> [out.json]' );
    process.exit( 2 );
}
const result = analyzePcm( basename( file ), await decodeMono( file ) );
const target = out ?? file.replace( /\.[^.]+$/, '.analysis.json' );
writeFileSync( target, `${ JSON.stringify( result ) }\n` );
console.error( `${ result.bpm } BPM · ${ result.beats.length } beats · ${ result.bars.length } bars → ${ target }` );
for ( const s of result.sections ) console.error( `  bars ${ s.fromBar }-${ s.toBar } ${ s.label } ${ s.energy }` );
for ( const [ band, onsets ] of Object.entries( result.drums ) ) {
    const perBar = ( onsets.length / Math.max( 1, result.bars.length ) ).toFixed( 2 );
    console.error( `  ${ band }: ${ onsets.length } onsets · ${ perBar } per bar` );
}
