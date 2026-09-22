import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    CELL,
    CRACK_EDGE_MARGIN_LANES,
    CRACK_SEGS_MAX,
    CRACK_W_LANES_MAX,
    CRACK_W_LANES_MIN,
    HALF_WIDTH,
    isHole,
    MIN_LANE,
    makeProcgenTrack,
    type ProcgenDescriptor,
    SEG_LEN,
    type Segment,
    START_SAFE,
    type Track,
} from '../index.js';

const LENGTH = 400;
const SEEDS = [ 20260921, 7, 991, 40404, 123456 ];

function track( seed: number ): Track {
    const d: ProcgenDescriptor = { kind: 'procgen', seed, tier: 0, length: LENGTH };
    return makeProcgenTrack( d );
}

function fullSpans( seg: Segment ) {
    return seg.floors.filter( ( f ) => f.z0 === undefined && f.z1 === undefined );
}

function isCrack( seg: Segment ): boolean {
    const spans = fullSpans( seg );
    if ( seg.kind !== 'gap' || spans.length !== 2 ) return false;
    return spans.some( ( f ) => f.x0 === -HALF_WIDTH ) && spans.some( ( f ) => f.x1 === HALF_WIDTH );
}

function crackWidth( seg: Segment ): number {
    const spans = [ ...fullSpans( seg ) ].sort( ( a, b ) => a.x0 - b.x0 );
    return spans[ 1 ].x0 - spans[ 0 ].x1;
}

function widestRun( seg: Segment ): number {
    return Math.max( ...seg.floors.map( ( f ) => f.x1 - f.x0 ) );
}

function holeWidth( seg: Segment ): number {
    const kept = fullSpans( seg ).reduce( ( a, f ) => a + ( f.x1 - f.x0 ), 0 );
    return 2 * HALF_WIDTH - kept;
}

function crackKey( seg: Segment ): string {
    const spans = [ ...fullSpans( seg ) ].sort( ( a, b ) => a.x0 - b.x0 );
    return `${ spans[ 0 ].x1 }:${ spans[ 1 ].x0 }`;
}

test( 'cracks exist and are narrow', () => {
    let seen = 0;
    for ( const seed of SEEDS ) {
        const t = track( seed );
        for ( let i = START_SAFE; i < LENGTH; i++ ) {
            const seg = t.segmentAt( i );
            if ( ! isCrack( seg ) ) continue;
            seen++;
            const w = crackWidth( seg );
            assert.ok(
                w >= CRACK_W_LANES_MIN * CELL && w <= CRACK_W_LANES_MAX * CELL,
                `seed ${ seed } seg ${ i }: crack width ${ w } outside [${ CRACK_W_LANES_MIN * CELL }, ${ CRACK_W_LANES_MAX * CELL }]`,
            );
        }
    }
    assert.ok( seen > 0, 'no cracks generated across any seed' );
} );

test( 'a crack segment is never a hole, so it is strafed and never jumped', () => {
    for ( const seed of SEEDS ) {
        const t = track( seed );
        for ( let i = START_SAFE; i < LENGTH; i++ ) {
            const seg = t.segmentAt( i );
            if ( isCrack( seg ) ) assert.ok( ! isHole( seg ), `seed ${ seed } seg ${ i }: crack reads as a hole` );
        }
    }
} );

test( 'a crack keeps threadable floor on both shoulders', () => {
    const margin = CRACK_EDGE_MARGIN_LANES * CELL;
    for ( const seed of SEEDS ) {
        const t = track( seed );
        for ( let i = START_SAFE; i < LENGTH; i++ ) {
            const seg = t.segmentAt( i );
            if ( ! isCrack( seg ) ) continue;
            for ( const f of fullSpans( seg ) ) {
                assert.ok(
                    f.x1 - f.x0 >= margin,
                    `seed ${ seed } seg ${ i }: shoulder ${ f.x1 - f.x0 } < ${ margin }`,
                );
            }
            assert.ok( widestRun( seg ) >= MIN_LANE, `seed ${ seed } seg ${ i }: widest run < MIN_LANE` );
        }
    }
} );

test( 'cracks run longer than one segment and narrower cracks run longer', () => {
    const byWidth = new Map< number, number >();
    for ( const seed of SEEDS ) {
        const t = track( seed );
        let i = START_SAFE;
        while ( i < LENGTH ) {
            if ( ! isCrack( t.segmentAt( i ) ) ) {
                i++;
                continue;
            }
            const w = crackWidth( t.segmentAt( i ) );
            const key = crackKey( t.segmentAt( i ) );
            let run = 0;
            while (
                i + run < LENGTH &&
                isCrack( t.segmentAt( i + run ) ) &&
                crackKey( t.segmentAt( i + run ) ) === key
            )
                run++;
            assert.ok( run >= 2, `seed ${ seed } seg ${ i }: crack run ${ run } shorter than 2 segments` );
            assert.ok(
                run <= CRACK_SEGS_MAX,
                `seed ${ seed } seg ${ i }: crack run ${ run } longer than ${ CRACK_SEGS_MAX }`,
            );
            byWidth.set( w, Math.max( byWidth.get( w ) ?? 0, run ) );
            i += run;
        }
    }
    const widths = [ ...byWidth.keys() ].sort( ( a, b ) => a - b );
    assert.ok( widths.length >= 2, 'need at least two distinct crack widths to compare lengths' );
    const narrowest = byWidth.get( widths[ 0 ] ) ?? 0;
    const widest = byWidth.get( widths[ widths.length - 1 ] ) ?? 0;
    assert.ok( narrowest >= widest, `narrowest crack runs ${ narrowest } segments, widest runs ${ widest }` );
} );

test( 'gap widths now span the range, not just the full track width', () => {
    const widths = new Set< number >();
    for ( const seed of SEEDS ) {
        const t = track( seed );
        for ( let i = START_SAFE; i < LENGTH; i++ ) {
            const seg = t.segmentAt( i );
            if ( seg.kind !== 'gap' ) continue;
            widths.add( holeWidth( seg ) );
        }
    }
    const sorted = [ ...widths ].sort( ( a, b ) => a - b );
    assert.ok( sorted[ 0 ] <= CRACK_W_LANES_MIN * CELL, `narrowest gap is ${ sorted[ 0 ] }u, expected ${ CELL }u` );
    assert.ok( sorted[ sorted.length - 1 ] >= 2 * HALF_WIDTH, 'no full-width gap generated' );
} );

test( 'a crack segment carries no blocks and no teeth', () => {
    for ( const seed of SEEDS ) {
        const t = track( seed );
        for ( let i = START_SAFE; i < LENGTH; i++ ) {
            const seg = t.segmentAt( i );
            if ( ! isCrack( seg ) ) continue;
            assert.equal( seg.blocks.length, 0, `seed ${ seed } seg ${ i }: crack carries blocks` );
            assert.equal( seg.floors.length, 2, `seed ${ seed } seg ${ i }: crack carries extra spans` );
            assert.equal( seg.z1 - seg.z0, SEG_LEN );
        }
    }
} );
