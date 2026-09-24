import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';
import type { ShipClassId } from '@slur/shared';
import { LAB_BUNDLE_VERSION, type LabBundle, type LabVariant } from './bundle.ts';
import { LAB_CLASSES } from './record.ts';
import { buildVariant } from './song-lab-build.ts';
import { type LabSongAnalysis, variantsFor } from './variants.ts';

export const LAB_DIR = join( import.meta.dirname, '..', '.songs', 'lab' );

function summary( v: LabVariant ): string {
    const played = v.score.notes.filter( ( n ) => n.kind !== 'rest' ).length;
    const runs = v.runs
        .map( ( r ) => {
            const res = r.result;
            return `${ r.classId } ${ res.finished ? 'fin' : 'DNF' } ${ res.time.toFixed( 1 ) }s d${ res.deaths } b${ res.bumps }`;
        } )
        .join( ' · ' );
    return `${ v.id.padEnd( 20 ) } ${ String( played ).padStart( 4 ) } notes · ${ runs }`;
}

function main(): void {
    const { values, positionals } = parseArgs( {
        allowPositionals: true,
        options: {
            seed: { type: 'string', default: '1' },
            only: { type: 'string' },
            classes: { type: 'string' },
            name: { type: 'string' },
        },
    } );
    const file = positionals[ 0 ];
    if ( file === undefined )
        throw new Error( 'usage: song-lab <song.analysis.json> [--seed N] [--only a,b] [--classes x,y] [--name n]' );
    const a = JSON.parse( readFileSync( file, 'utf8' ) ) as LabSongAnalysis;
    const seed = Number( values.seed );
    const only = values.only?.split( ',' );
    const classes = ( values.classes?.split( ',' ) as ShipClassId[] | undefined ) ?? LAB_CLASSES;
    const specs = variantsFor( a ).filter( ( s ) => only === undefined || only.includes( s.id ) );
    const variants = specs.map( ( s ) => {
        const t0 = performance.now();
        const v = buildVariant( s, a, seed, classes );
        console.log( `${ summary( v ) }  (${ ( ( performance.now() - t0 ) / 1000 ).toFixed( 1 ) }s)` );
        return v;
    } );
    const bundle: LabBundle = {
        version: LAB_BUNDLE_VERSION,
        createdAt: new Date().toISOString(),
        song: { file: a.song, duration: a.duration, bpm: a.bpm, beatsPerBar: a.beatsPerBar, sections: a.sections },
        variants,
    };
    const name = values.name ?? `${ basename( file ).replace( /\.analysis\.json$/, '' ) }-s${ seed }`;
    mkdirSync( LAB_DIR, { recursive: true } );
    const out = join( LAB_DIR, `${ name }.json` );
    writeFileSync( out, JSON.stringify( bundle ) );
    console.log( `wrote ${ out }` );
}

main();
