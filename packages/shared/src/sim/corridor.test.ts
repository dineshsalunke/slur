import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CELL, DEFAULT_TUNING, PINCH_LANES } from '../constants.js';
import { passableCorridorWidth } from './clearance.js';
import { bandAt } from './corridor.js';
import {
    FULL_DENSITY,
    HALF_WIDTH,
    isHole,
    MIN_LANE,
    SEG_LEN,
    type Segment,
    spanHasZ,
    TRACK_SEGMENTS,
    type Track,
} from './space.js';
import { procgenDescriptor, resolveTrack } from './track-provider.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 42, 99991, 7 ];
const SEG_S = SEG_LEN / DEFAULT_TUNING.maxCruise;
const HULL = 2 * DEFAULT_TUNING.halfW;
const MAX_COAST_S = 18;

function openRuns( seg: Segment ): Array< [ number, number ] > {
    const zc = ( seg.z0 + seg.z1 ) / 2;
    const runs: Array< [ number, number ] > = [];
    for ( const f of seg.floors ) {
        if ( ! spanHasZ( seg, f, zc ) ) continue;
        const walls = seg.blocks
            .filter( ( b ) => b.z0 <= zc && zc < b.z1 )
            .map( ( b ): [ number, number ] => [ Math.max( f.x0, b.x0 ), Math.min( f.x1, b.x1 ) ] )
            .filter( ( [ lo, hi ] ) => hi > lo )
            .sort( ( a, b ) => a[ 0 ] - b[ 0 ] );
        let cursor = f.x0;
        for ( const [ lo, hi ] of walls ) {
            if ( lo > cursor ) runs.push( [ cursor, lo ] );
            cursor = Math.max( cursor, hi );
        }
        if ( f.x1 > cursor ) runs.push( [ cursor, f.x1 ] );
    }
    return runs.filter( ( [ lo, hi ] ) => hi - lo >= HULL );
}

function walkLine( t: Track ): { moves: number[]; peak: number } {
    let x = 0;
    let peak = 0;
    const moves: number[] = [];
    for ( let i = 0; i < TRACK_SEGMENTS; i++ ) {
        const seg = t.segmentAt( i );
        if ( seg.kind === 'gap' ) {
            moves.push( Number.POSITIVE_INFINITY );
            continue;
        }
        const runs = openRuns( seg );
        if ( runs.length === 0 ) continue;
        let target = x;
        let best = Number.POSITIVE_INFINITY;
        for ( const [ lo, hi ] of runs ) {
            const aim = Math.min( Math.max( x, lo + HULL / 2 ), hi - HULL / 2 );
            if ( Math.abs( aim - x ) < best ) {
                best = Math.abs( aim - x );
                target = aim;
            }
        }
        const dx = Math.abs( target - x );
        moves.push( dx );
        if ( dx / SEG_S > peak ) peak = dx / SEG_S;
        x = target;
    }
    return { moves, peak };
}

test( 'no stretch of track lets the player coast without steering for too long', () => {
    for ( const seed of SEEDS ) {
        const { moves } = walkLine( resolveTrack( procgenDescriptor( seed ) ) );
        let run = 0;
        let longest = 0;
        for ( const dx of moves ) {
            if ( dx < 1 ) run++;
            else run = 0;
            if ( run > longest ) longest = run;
        }
        const seconds = longest * SEG_S;
        assert.ok(
            seconds <= MAX_COAST_S,
            `seed ${ seed }: ${ seconds.toFixed( 1 ) }s of track needs no steering input`,
        );
    }
} );

test( 'pinches really close the corridor, and never below the threadable floor', () => {
    let pinched = 0;
    let narrowest = Number.POSITIVE_INFINITY;
    for ( const seed of SEEDS ) {
        const t = resolveTrack( procgenDescriptor( seed ) );
        for ( let i = 0; i < TRACK_SEGMENTS; i++ ) {
            if ( ! bandAt( seed, i, TRACK_SEGMENTS, FULL_DENSITY ).pinched ) continue;
            pinched++;
            const seg = t.segmentAt( i );
            if ( isHole( seg ) ) continue;
            const w = passableCorridorWidth( seg );
            assert.ok( w >= MIN_LANE - 1e-6, `seed ${ seed } seg ${ i }: pinch corridor ${ w }u below MIN_LANE` );
            if ( w < narrowest ) narrowest = w;
        }
    }
    assert.ok( pinched > 0, 'no pinch fires on any seed' );
    assert.ok( narrowest <= PINCH_LANES * CELL, `narrowest pinch is ${ narrowest }u — the gate never actually closes` );
} );

test( 'a pinch gate is a wall with one hole, not a suggestion', () => {
    for ( const seed of SEEDS ) {
        const t = resolveTrack( procgenDescriptor( seed ) );
        for ( let i = 0; i < TRACK_SEGMENTS; i++ ) {
            const band = bandAt( seed, i, TRACK_SEGMENTS, FULL_DENSITY );
            if ( ! band.pinched ) continue;
            const seg = t.segmentAt( i );
            if ( seg.kind === 'gap' ) continue;
            const runs = openRuns( seg );
            assert.equal( runs.length, 1, `seed ${ seed } seg ${ i }: pinch has ${ runs.length } ways through, not 1` );
            const [ lo, hi ] = runs[ 0 ];
            assert.ok(
                lo >= -HALF_WIDTH + band.lo * CELL - 1e-6 && hi <= -HALF_WIDTH + ( band.hi + 1 ) * CELL + 1e-6,
                `seed ${ seed } seg ${ i }: the way through is not the band`,
            );
        }
    }
} );
