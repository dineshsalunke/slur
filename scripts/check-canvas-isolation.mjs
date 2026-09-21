import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve( dirname( fileURLToPath( import.meta.url ) ), '../apps/client/app' );

function stripComments( src ) {
    return src.replace( /\/\*[\s\S]*?\*\//g, ' ' ).replace( /\/\/[^\n]*/g, ' ' );
}

function strip( src ) {
    return stripComments(
        src
            .replace( /`(?:\\.|[^`\\])*`/g, '``' )
            .replace( /'(?:\\.|[^'\\])*'/g, "''" )
            .replace( /"(?:\\.|[^"\\])*"/g, '""' ),
    );
}

function tsxFiles( dir ) {
    const out = [];
    for ( const name of readdirSync( dir ) ) {
        const full = join( dir, name );
        if ( statSync( full ).isDirectory() ) out.push( ...tsxFiles( full ) );
        else if ( name.endsWith( '.tsx' ) ) out.push( full );
    }
    return out;
}

function canvasWrapperNames( files ) {
    const names = new Set( [ 'Canvas' ] );
    for ( const file of files ) {
        const code = strip( readFileSync( file, 'utf8' ) );
        if ( ! /<Canvas[\s/>]/.test( code ) ) continue;
        for ( const m of code.matchAll( /export\s+(?:default\s+)?function\s+([A-Z]\w*)/g ) ) names.add( m[ 1 ] );
    }
    return names;
}

function routeEntryFiles() {
    const routesTs = stripComments( readFileSync( join( APP, 'routes.ts' ), 'utf8' ) );
    const entries = [ join( APP, 'root.tsx' ) ];
    for ( const m of routesTs.matchAll( /['"]([\w./-]+\.tsx)['"]/g ) ) entries.push( join( APP, m[ 1 ] ) );
    return entries;
}

const wrappers = canvasWrapperNames( tsxFiles( APP ) );
const violations = [];

for ( const file of routeEntryFiles() ) {
    const code = strip( readFileSync( file, 'utf8' ) );
    const rendered = [ ...wrappers ].filter( ( name ) => new RegExp( `<${ name }[\\s/>]` ).test( code ) );
    if ( rendered.length === 0 ) continue;
    const hooks = [ ...new Set( [ ...code.matchAll( /\b(?:React\.)?(use[A-Z]\w*)\s*\(/g ) ].map( ( m ) => m[ 1 ] ) ) ];
    if ( hooks.length > 0 ) violations.push( { file, wrapper: rendered[ 0 ], hooks } );
}

if ( violations.length > 0 ) {
    console.error( '✖ Canvas-isolation (non-negotiable #10, issue #102): route entry modules that render a Canvas' );
    console.error( '  must hold ZERO hooks — a hook there re-renders the whole scene subtree. Push it to a leaf.\n' );
    for ( const v of violations ) {
        const rel = v.file.slice( v.file.indexOf( 'apps/' ) );
        console.error( `  ${ rel } renders <${ v.wrapper }> and calls: ${ v.hooks.join( ', ' ) }` );
    }
    process.exit( 1 );
}

console.log(
    `✓ Canvas-isolation: ${ routeEntryFiles().length } route entry modules clean (wrappers: ${ [ ...wrappers ].join( ', ' ) })`,
);
