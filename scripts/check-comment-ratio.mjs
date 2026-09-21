import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASE = process.env.COMMENT_RATCHET_BASE ?? 'origin/dev';
const NEW_FILE_MAX_RATIO = 0.2;
const NEW_FILE_FLOOR = 6;
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*\/|\*|\{\s*\/\*)/;
const SCOPED = /^(apps|packages|scripts)\/.*\.(ts|tsx|mjs|js)$/;

const git = ( ...args ) => execFileSync( 'git', args, { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ] } );
const countComments = ( src ) => src.split( '\n' ).filter( ( l ) => COMMENT_LINE.test( l ) ).length;

let base;
try {
    base = git( 'merge-base', BASE, 'HEAD' ).trim();
} catch {
    console.log( `• Comment ratchet: skipped, no merge-base with ${ BASE }` );
    process.exit( 0 );
}

const changed = [
    ...git( 'diff', '--name-only', base ).split( '\n' ),
    ...git( 'ls-files', '--others', '--exclude-standard' ).split( '\n' ),
].filter( ( f ) => SCOPED.test( f ) );

const grown = [];
const overBudget = [];

for ( const file of changed ) {
    if ( ! existsSync( file ) ) continue;
    const after = countComments( readFileSync( file, 'utf8' ) );

    let before = null;
    try {
        before = countComments( git( 'show', `${ base }:${ file }` ) );
    } catch {
        before = null;
    }

    if ( before === null ) {
        const total = readFileSync( file, 'utf8' ).split( '\n' ).length;
        const ratio = after / total;
        if ( after > NEW_FILE_FLOOR && ratio > NEW_FILE_MAX_RATIO ) {
            overBudget.push( { file, after, total, ratio } );
        }
    } else if ( after > before ) {
        grown.push( { file, before, after } );
    }
}

if ( grown.length > 0 || overBudget.length > 0 ) {
    console.error( '✖ Comment ratchet (CONTRIBUTING §3): comment only what the code cannot say, in 1-2 plain' );
    console.error( '  lines. History, rationale and rejected alternatives go in the PR body.\n' );
    for ( const g of grown ) {
        console.error( `  ${ g.file } gained comment lines: ${ g.before } → ${ g.after }` );
    }
    for ( const o of overBudget ) {
        const pct = ( o.ratio * 100 ).toFixed( 1 );
        console.error(
            `  ${ o.file } is new and ${ pct }% comments (${ o.after }/${ o.total }), over the ${ NEW_FILE_MAX_RATIO * 100 }% budget`,
        );
    }
    console.error( '\n  A comment that genuinely earns its place still passes: delete two elsewhere in the file.' );
    process.exit( 1 );
}

console.log( `✓ Comment ratchet: ${ changed.length } changed source files, none gained comment lines` );
