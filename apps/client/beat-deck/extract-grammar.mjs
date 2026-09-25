import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const STRAFE = { ArrowLeft: 1, KeyA: 1, ArrowRight: -1, KeyD: -1 };
const JUMP = new Set( [ 'Space', 'ArrowUp', 'KeyW' ] );
const MAX_GAP_BEATS = 4;
const DX_BIN = 4;
const DX_BINS = 10;

const takes = process.argv.slice( 2 );
if ( takes.length === 0 ) {
    process.stderr.write( 'usage: node extract-grammar.mjs <take.json>...\n' );
    process.exit( 1 );
}

const songDir = dirname( dirname( takes[ 0 ] ) );
const songName = JSON.parse( readFileSync( takes[ 0 ], 'utf8' ) ).song.name.replace( /\.mp3$/, '' );
const analysis = JSON.parse( readFileSync( join( songDir, `${ songName }.analysis.json` ), 'utf8' ) );
const beats = analysis.beats;

function nearestBeat( s ) {
    let lo = 0;
    let hi = beats.length - 1;
    while ( hi - lo > 1 ) {
        const mid = ( lo + hi ) >> 1;
        if ( beats[ mid ] <= s ) lo = mid;
        else hi = mid;
    }
    return Math.abs( beats[ lo ] - s ) <= Math.abs( beats[ hi ] - s ) ? lo : hi;
}

function bandOfBeat( b ) {
    const bar = analysis.bars.findLastIndex( ( t ) => t <= beats[ b ] );
    return analysis.sections.find( ( s ) => bar >= s.fromBar && bar < s.toBar )?.label ?? 'low';
}

function emptyBand() {
    return {
        events: 0,
        gapBeats: Array( MAX_GAP_BEATS ).fill( 0 ),
        rests: 0,
        jumps: 0,
        strafes: 0,
        dx: Array( DX_BINS ).fill( 0 ),
    };
}

const bands = { low: emptyBand(), mid: emptyBand(), high: emptyBand() };
let switched = 0;
let kept = 0;
let signAgree = 0;
let signTotal = 0;

for ( const path of takes ) {
    const take = JSON.parse( readFileSync( path, 'utf8' ) );
    const { ticks, keys } = take;
    const xAtTick = new Map( ticks.tick.map( ( t, i ) => [ t, ticks.x[ i ] ] ) );
    const byBeat = new Map();
    keys.code.forEach( ( code, i ) => {
        if ( ! keys.down[ i ] || keys.songMs[ i ] < 0 ) return;
        const dir = STRAFE[ code ] ?? 0;
        const jump = JUMP.has( code );
        if ( dir === 0 && ! jump ) return;
        const beat = nearestBeat( keys.songMs[ i ] / 1000 );
        const ev = byBeat.get( beat ) ?? { beat, dir: 0, jump: false, tick: keys.tick[ i ] };
        if ( dir !== 0 && ev.dir === 0 ) {
            ev.dir = dir;
            ev.tick = keys.tick[ i ];
        }
        ev.jump ||= jump;
        byBeat.set( beat, ev );
    } );
    const events = [ ...byBeat.values() ].sort( ( a, b ) => a.beat - b.beat );
    let lastDir = 0;
    events.forEach( ( ev, k ) => {
        const band = bands[ bandOfBeat( ev.beat ) ];
        const next = events[ k + 1 ];
        countEvent( band, ev, next );
        if ( ev.dir === 0 ) return;
        if ( lastDir !== 0 ) {
            if ( ev.dir === lastDir ) kept++;
            else switched++;
        }
        lastDir = ev.dir;
        countTravel( band, ev, next, xAtTick );
    } );
}

function countEvent( band, ev, next ) {
    band.events++;
    if ( ev.jump ) band.jumps++;
    if ( ev.dir !== 0 ) band.strafes++;
    if ( next === undefined ) return;
    const gap = next.beat - ev.beat;
    if ( gap > MAX_GAP_BEATS ) band.rests++;
    else band.gapBeats[ gap - 1 ]++;
}

function countTravel( band, ev, next, xAtTick ) {
    if ( next === undefined || next.beat - ev.beat > MAX_GAP_BEATS ) return;
    const dx = ( xAtTick.get( next.tick ) ?? 0 ) - ( xAtTick.get( ev.tick ) ?? 0 );
    signTotal++;
    if ( Math.sign( dx ) === ev.dir ) signAgree++;
    band.dx[ Math.min( DX_BINS - 1, Math.floor( Math.abs( dx ) / DX_BIN ) ) ]++;
}

const sectionLengths = { low: {}, mid: {}, high: {} };
const sectionNext = { low: {}, mid: {}, high: {} };
analysis.sections.forEach( ( s, k ) => {
    const bars = s.toBar - s.fromBar;
    if ( bars < 4 ) return;
    sectionLengths[ s.label ][ bars ] = ( sectionLengths[ s.label ][ bars ] ?? 0 ) + 1;
    const next = analysis.sections[ k + 1 ];
    if ( next !== undefined && next.toBar - next.fromBar >= 4 )
        sectionNext[ s.label ][ next.label ] = ( sectionNext[ s.label ][ next.label ] ?? 0 ) + 1;
} );

process.stdout.write(
    `${ JSON.stringify(
        {
            song: songName,
            takes: takes.map( ( t ) => basename( t ) ),
            beatS: 60 / analysis.bpm,
            beatsPerBar: analysis.beatsPerBar,
            dxBin: DX_BIN,
            alternate: { switched, kept },
            dxSignAgreement: `${ signAgree }/${ signTotal }`,
            bands,
            sectionLengths,
            sectionNext,
        },
        null,
        2,
    ) }\n`,
);
