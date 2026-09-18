// Canvas-isolation guard (issue #102, non-negotiable #10) — a structural enforcement of what was "enforced by
// discipline" before.
//
// THE RULE: a **route entry module** that renders an R3F `<Canvas>` (or a Canvas-wrapper component) as a sibling
// must call ZERO React hooks. Any hook re-renders the route component, which reconciles the entire scene
// subtree — measured in PR #98: every call-sign keystroke walked LandingScene / LandingRig / Environment
// through R3F's reconciler (18 → 0 once the state moved to a leaf). #10's fix is to push every subscription
// DOWN to a leaf; this check makes a regression impossible-to-miss instead of merely discouraged. `React.memo`
// was explicitly rejected on the issue — it would hide the violation, not prevent it.
//
// WHY A LEXICAL CHECK (not an AST rule): TypeScript 7's native package exposes no JS compiler API
// (`ts.createSourceFile` is undefined), and Biome's GritQL JSX matching is undocumented/unverified at 2.5.7. The
// scope is a handful of small, Biome-formatted route entry files, so a comment/string-stripped scan is reliable
// — and it is proved to FAIL when a hook is added (see the PR's mutation check). Runs in `pnpm lint`.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve( dirname( fileURLToPath( import.meta.url ) ), '../apps/client/app' );

// Block + line comments only. Used on routes.ts, where the .tsx paths we need ARE string literals, so strings
// must survive (a commented-out route is still correctly ignored).
function stripComments( src ) {
    return src.replace( /\/\*[\s\S]*?\*\//g, ' ' ).replace( /\/\/[^\n]*/g, ' ' );
}

// Strip strings/template literals AND comments so a `use…(` or `<Canvas` inside prose or a string never counts.
// Strings first (they can contain `//`), then comments. Good enough for the formatted route files this runs
// over; the mutation test guards correctness.
function strip( src ) {
    return stripComments(
        src
            .replace( /`(?:\\.|[^`\\])*`/g, '``' ) // template literals
            .replace( /'(?:\\.|[^'\\])*'/g, "''" ) // single-quoted strings
            .replace( /"(?:\\.|[^"\\])*"/g, '""' ), // double-quoted strings
    );
}

// Every `.tsx` under app/, recursively.
function tsxFiles( dir ) {
    const out = [];
    for ( const name of readdirSync( dir ) ) {
        const full = join( dir, name );
        if ( statSync( full ).isDirectory() ) out.push( ...tsxFiles( full ) );
        else if ( name.endsWith( '.tsx' ) ) out.push( full );
    }
    return out;
}

// A "Canvas wrapper" is any component EXPORTED from a file that itself renders `<Canvas>` (the R3F root). The
// route renders the wrapper by name — LandingScene / NetCanvas / EnvLabCanvas today — so auto-discover them
// rather than hard-code a list that would silently rot when a new scene is added.
function canvasWrapperNames( files ) {
    const names = new Set( [ 'Canvas' ] ); // a route could also render <Canvas> directly
    for ( const file of files ) {
        const code = strip( readFileSync( file, 'utf8' ) );
        if ( ! /<Canvas[\s/>]/.test( code ) ) continue;
        for ( const m of code.matchAll( /export\s+(?:default\s+)?function\s+([A-Z]\w*)/g ) ) names.add( m[ 1 ] );
    }
    return names;
}

// The route ENTRY modules — the files React Router mounts as routes (routes.ts) plus the root layout. NOT their
// colocated sub-components (routes/home/call-sign-console.tsx etc.), which are leaves and may hold hooks freely.
function routeEntryFiles() {
    // Comment-strip only (NOT string-strip) — the .tsx paths we need ARE the string literals; stripping strings
    // would erase them. Commented-out routes are correctly ignored.
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
    if ( rendered.length === 0 ) continue; // not a Canvas-parent route → hooks are fine here
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
