import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = '/Users/apple/Projects/personal/slur';
const APP = join( ROOT, 'apps/client/app' );
const dry = process.argv.includes( '--dry' );
const moves = process.argv
    .slice( 2 )
    .filter( ( a ) => a !== '--dry' )
    .map( ( f ) => {
        const from = resolve( APP, f );
        const base = from.replace( /\.tsx$/, '' );
        const name = base.split( '/' ).pop();
        return { from, to: join( dirname( from ), name, `${ name }.tsx` ) };
    } );

const EXTS = [ '.tsx', '.ts', '/index.ts', '/index.tsx' ];
const resolveSpec = ( file, spec ) => {
    const abs = resolve( dirname( file ), spec );
    for ( const e of [ '', ...EXTS ] )
        if ( existsSync( abs + e ) && ! abs.endsWith( '/' ) && ( e || /\.[a-z]+$/.test( abs ) ) ) return abs + e;
    return null;
};
const toSpec = ( fromFile, target ) => {
    let s = relative( dirname( fromFile ), target ).replace( /\.tsx?$/, '' );
    if ( ! s.startsWith( '.' ) ) s = `./${ s }`;
    return s;
};

const rule = ( lang ) => `id: spec
language: ${ lang }
rule:
  kind: string
  regex: "^['\\"][.][.]?/"`;
const scan = ( lang, glob ) =>
    JSON.parse(
        execFileSync( 'ast-grep', [ 'scan', '--inline-rules', rule( lang ), '--json=compact', '--globs', glob, APP ], {
            encoding: 'utf8',
            maxBuffer: 1 << 28,
        } ),
    );
const hits = [ ...scan( 'tsx', '*.tsx' ), ...scan( 'typescript', '*.ts' ) ];

const moved = new Map( moves.map( ( m ) => [ m.from, m.to ] ) );
const edits = new Map();
for ( const h of hits ) {
    const file = h.file.startsWith( '/' ) ? h.file : join( APP, h.file );
    const quote = h.text[ 0 ];
    const spec = h.text.slice( 1, -1 );
    const target = resolveSpec( file, spec );
    if ( ! target ) continue;
    const newFile = moved.get( file ) ?? file;
    const newTarget = moved.get( target ) ?? target;
    if ( newFile === file && newTarget === target ) continue;
    const next = toSpec( newFile, newTarget );
    if ( next === spec ) continue;
    if ( ! edits.has( file ) ) edits.set( file, new Map() );
    edits.get( file ).set( h.text, `${ quote }${ next }${ quote }` );
}

for ( const [ file, pairs ] of edits ) {
    for ( const [ a, b ] of pairs ) {
        console.log( `${ relative( APP, file ) }: ${ a } -> ${ b }` );
        if ( dry ) continue;
        const lang = file.endsWith( '.tsx' ) ? 'tsx' : 'typescript';
        execFileSync( 'ast-grep', [ 'run', '-l', lang, '-p', a, '-r', b, '-U', file ], { stdio: 'ignore' } );
    }
}
if ( ! dry ) {
    for ( const { from, to } of moves ) {
        mkdirSync( dirname( to ), { recursive: true } );
        execFileSync( 'git', [ '-C', ROOT, 'mv', from, to ] );
        console.log( `moved ${ relative( APP, from ) } -> ${ relative( APP, to ) }` );
    }
}
