import { CALM_TUBE_HALF, CELL, MAX_SHIP_WIDTH } from '../../constants.js';
import { SCORE_REGISTER_CRUISE } from '../../pacing/score.js';
import { corridorWidthLanes } from '../intensity.js';
import { hash2, mulberry32 } from '../rng.js';
import {
    BLOCK_HEIGHT,
    type Block,
    type BlockBox,
    blockId,
    fullFloor,
    HALF_WIDTH,
    LEAD_SEGMENTS,
    MIN_LANE,
    SEG_LEN,
    type Segment,
    START_SAFE,
    segIndexForZ,
    TRACK_SEGMENTS,
    type Track,
} from '../space.js';
import {
    type ComposedNote,
    type ComposedScore,
    composeScore,
    type IntensityCurve,
    scoreIntensityAt,
} from './compose.js';
import { SETTLE_X_TOL } from './note-move.js';
import { SMASH_NOTE_DEPTH } from './notes.js';

export const SCORE_PIN_HALF = MAX_SHIP_WIDTH / 2 + 2 * SETTLE_X_TOL;
export const SCORE_PIN_Z = CELL;
export const SCORE_GATE_Z = SEG_LEN;
export const SCORE_GATE_FAR = Math.max( CALM_TUBE_HALF, MIN_LANE - SCORE_PIN_HALF );
export const SCORE_BUMP = CELL;
export const SCORE_BUMP_MIN_CALM = 2 * SEG_LEN;
export const SCORE_BUMP_RATE = 0.5;
export const SMASH_HALF = CALM_TUBE_HALF - MIN_LANE / 4;

const SALT_BUMP = 0x2c6b9e47 | 0;

export type OpenSpanRole = 'calm' | 'preview' | 'move' | 'gate' | 'smash';

export interface OpenSpan {
    z0: number;
    z1: number;
    a: number;
    b: number;
    line: number;
    role: OpenSpanRole;
}

export interface EmittedScore {
    score: ComposedScore;
    spans: OpenSpan[];
    segments: Segment[];
}

export function isLateral( n: Pick< ComposedNote, 'kind' > ): boolean {
    return n.kind === 'step' || n.kind === 'held';
}

export function moveZ( n: ComposedNote ): number {
    return Math.ceil( ( n.move * SCORE_REGISTER_CRUISE ) / CELL ) * CELL;
}

export function freeReach( z: number, length: number, curve?: IntensityCurve ): number {
    return corridorWidthLanes( scoreIntensityAt( segIndexForZ( z ), length, curve ) ) * CELL - CALM_TUBE_HALF;
}

function nextLateralDirs( notes: readonly ComposedNote[] ): number[] {
    const out = new Array< number >( notes.length ).fill( 0 );
    let dir = 0;
    for ( let i = notes.length - 1; i >= 0; i-- ) {
        out[ i ] = dir;
        if ( isLateral( notes[ i ] ) ) dir = notes[ i ].dir;
    }
    return out;
}

function sided( line: number, dir: number, near: number, far: number ): [ number, number ] {
    const lo = dir > 0 ? line - far : line - near;
    const hi = dir > 0 ? line + near : line + far;
    return [ Math.max( -HALF_WIDTH, lo ), Math.min( HALF_WIDTH, hi ) ];
}

function calmEdges( line: number, walled: number, reach: number ): [ number, number ] {
    if ( walled === 0 ) return [ Math.max( -HALF_WIDTH, line - reach ), Math.min( HALF_WIDTH, line + reach ) ];
    return sided( line, walled, CALM_TUBE_HALF, reach );
}

function gateEdges( n: ComposedNote, walledNext: boolean, reach: number ): [ number, number ] {
    const far = n.accent || walledNext ? SCORE_GATE_FAR : reach;
    return sided( n.x, -n.dir, SCORE_PIN_HALF, far );
}

export function scoreSpans( score: ComposedScore ): OpenSpan[] {
    const spans: OpenSpan[] = [];
    const push = ( z0: number, z1: number, ab: [ number, number ], line: number, role: OpenSpanRole ): void => {
        if ( z1 > z0 ) spans.push( { z0, z1, a: ab[ 0 ], b: ab[ 1 ], line, role } );
    };
    const reachAt = ( z: number ): number => freeReach( z, score.length, score.curve );
    const calm = ( z0: number, z1: number, line: number, walled: number, upcoming?: ComposedNote ): void => {
        const pinned = upcoming !== undefined && isLateral( upcoming );
        const pin = pinned ? Math.max( z0, z1 - SCORE_PIN_Z ) : z1;
        push( z0, pin, calmEdges( line, walled, reachAt( z0 ) ), line, 'calm' );
        if ( pinned ) push( pin, z1, sided( line, upcoming.dir, SCORE_PIN_HALF, reachAt( pin ) ), line, 'preview' );
    };
    const next = nextLateralDirs( score.notes );
    let line = 0;
    score.notes.forEach( ( n, i ) => {
        const end = n.z + n.duration;
        const upcoming = score.notes[ i + 1 ];
        if ( isLateral( n ) ) {
            const reach = reachAt( n.z );
            const moved = Math.min( end, n.z + moveZ( n ) );
            const lo = n.dir > 0 ? line - reach : n.x - CALM_TUBE_HALF;
            const hi = n.dir > 0 ? n.x + CALM_TUBE_HALF : line + reach;
            push( n.z, moved, [ Math.max( -HALF_WIDTH, lo ), Math.min( HALF_WIDTH, hi ) ], n.x, 'move' );
            const gated = Math.min( end, moved + SCORE_GATE_Z );
            push( moved, gated, gateEdges( n, next[ i ] === n.dir, reach ), n.x, 'gate' );
            line = n.x;
            calm( gated, end, line, next[ i ], upcoming );
            return;
        }
        if ( n.kind === 'smash' ) {
            const hit = n.z + SMASH_NOTE_DEPTH;
            push( n.z, hit, calmEdges( line, 0, CALM_TUBE_HALF ), line, 'smash' );
            calm( hit, end, line, next[ i ], upcoming );
            return;
        }
        calm( n.z, end, line, next[ i ], upcoming );
    } );
    const last = score.notes[ score.notes.length - 1 ];
    const tail = last === undefined ? START_SAFE * SEG_LEN : last.z + last.duration;
    calm( tail, score.length * SEG_LEN, line, 0 );
    return spans;
}

function holeSegments( score: ComposedScore ): Set< number > {
    const out = new Set< number >();
    for ( const n of score.notes ) {
        const i = segIndexForZ( n.z );
        if ( n.kind === 'jump' ) out.add( i );
        if ( n.kind === 'double' ) {
            out.add( i );
            out.add( i + 1 );
        }
    }
    return out;
}

function wallBox( x0: number, x1: number, z0: number, z1: number ): BlockBox {
    return { x0, x1, y0: 0, y1: BLOCK_HEIGHT, z0, z1 };
}

function wallRuns( spans: readonly OpenSpan[], side: 'a' | 'b' ): BlockBox[] {
    const out: BlockBox[] = [];
    for ( const s of spans ) {
        const x0 = side === 'a' ? -HALF_WIDTH : s.b;
        const x1 = side === 'a' ? s.a : HALF_WIDTH;
        if ( x1 - x0 <= 1e-6 ) continue;
        const prev = out[ out.length - 1 ];
        if ( prev !== undefined && prev.x0 === x0 && prev.x1 === x1 && prev.z1 === s.z0 ) prev.z1 = s.z1;
        else out.push( wallBox( x0, x1, s.z0, s.z1 ) );
    }
    return out;
}

function bumpOf( seed: number, s: OpenSpan, k: number ): BlockBox | null {
    if ( s.role !== 'calm' || s.z1 - s.z0 < SCORE_BUMP_MIN_CALM ) return null;
    if ( mulberry32( hash2( ( seed ^ SALT_BUMP ) | 0, k ) )() >= SCORE_BUMP_RATE ) return null;
    const room = ( edge: number, open: boolean ): number => {
        const r = Math.abs( edge - s.line ) - SCORE_BUMP;
        return open && r >= CALM_TUBE_HALF + MIN_LANE / 4 ? r : -1;
    };
    const left = room( s.a, s.a > -HALF_WIDTH );
    const right = room( s.b, s.b < HALF_WIDTH );
    if ( left < 0 && right < 0 ) return null;
    const z0 = Math.floor( ( s.z0 + s.z1 ) / 2 / CELL ) * CELL;
    const z1 = z0 + SCORE_BUMP;
    return left >= right ? wallBox( s.a, s.a + SCORE_BUMP, z0, z1 ) : wallBox( s.b - SCORE_BUMP, s.b, z0, z1 );
}

function smashOf( s: OpenSpan ): BlockBox | null {
    return s.role === 'smash' ? wallBox( s.line - SMASH_HALF, s.line + SMASH_HALF, s.z0, s.z1 ) : null;
}

function clipToSegment( box: BlockBox, z0: number, z1: number ): BlockBox | null {
    const lo = Math.max( box.z0, z0 );
    const hi = Math.min( box.z1, z1 );
    return hi - lo > 1e-6 ? { ...box, z0: lo, z1: hi } : null;
}

export function emitSegments( score: ComposedScore, spans: readonly OpenSpan[] ): Segment[] {
    const walls = [ ...wallRuns( spans, 'a' ), ...wallRuns( spans, 'b' ) ];
    const bumps = spans.map( ( s, k ) => bumpOf( score.seed, s, k ) ).filter( ( b ) => b !== null );
    const smashes = spans.map( smashOf ).filter( ( b ) => b !== null );
    const holes = holeSegments( score );
    return Array.from( { length: score.length }, ( _, i ): Segment => {
        const z0 = i * SEG_LEN;
        const z1 = z0 + SEG_LEN;
        const base = { index: i, z0, z1, isFinish: false };
        if ( i < START_SAFE ) return { ...base, kind: 'plain', floors: fullFloor( 0 ), blocks: [] };
        const blocks = segmentBlocks( i, z0, z1, [
            [ walls, 'sealed' ],
            [ bumps, 'sealed' ],
            [ smashes, 'fractured' ],
        ] );
        const hole = holes.has( i );
        return {
            ...base,
            kind: hole ? 'gap' : blocks.length > 0 ? 'block' : 'plain',
            floors: hole ? [] : fullFloor( 0 ),
            blocks,
        };
    } );
}

function segmentBlocks(
    i: number,
    z0: number,
    z1: number,
    groups: readonly [ readonly BlockBox[], Block[ 'kind' ] ][],
): Block[] {
    const blocks: Block[] = [];
    for ( const [ boxes, kind ] of groups )
        for ( const box of boxes ) {
            const clipped = clipToSegment( box, z0, z1 );
            if ( clipped !== null ) blocks.push( { ...clipped, id: blockId( i, blocks.length ), kind } );
        }
    return blocks;
}

export function emitScore( score: ComposedScore ): EmittedScore {
    const spans = scoreSpans( score );
    return { score, spans, segments: emitSegments( score, spans ) };
}

export function segmentsTrack( segments: readonly Segment[], length: number ): Track {
    const segmentAt = ( i: number ): Segment => {
        const z0 = i * SEG_LEN;
        const base = { index: i, z0, z1: z0 + SEG_LEN, blocks: [] as Block[], isFinish: false };
        if ( i >= length ) return { ...base, kind: 'finish', floors: fullFloor( 0 ), isFinish: true };
        if ( i < -LEAD_SEGMENTS ) return { ...base, kind: 'gap', floors: [] };
        if ( i < 0 ) return { ...base, kind: 'plain', floors: fullFloor( 0 ) };
        return segments[ i ];
    };
    return {
        finishZ: length * SEG_LEN,
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ),
        anchors: [],
    };
}

export function scoreTrack( seed: number, length: number = TRACK_SEGMENTS ): Track {
    return segmentsTrack( emitScore( composeScore( seed, length ) ).segments, length );
}
