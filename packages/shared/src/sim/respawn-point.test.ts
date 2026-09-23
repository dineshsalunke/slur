import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING } from '../constants.js';
import { respawnPoint } from './respawn-point.js';
import {
    BLOCK_HEIGHT,
    type Block,
    blockId,
    HALF_WIDTH,
    LEAD_SEGMENTS,
    SEG_LEN,
    type Segment,
    START_SAFE,
    segIndexForZ,
    spanHasZ,
    type Track,
} from './space.js';
import { resolveTrack } from './track-provider.js';

const t = DEFAULT_TUNING;
const LIMIT = t.halfWidth - t.halfW;
const EDGE = 1e-3;
const SEEDS = [ 1, 13, 28 ];
const GRID = 0.05;
const STEP = 2 * t.halfL;

function justBefore( wallZ: number, p: { z: number } ): boolean {
    return p.z + t.halfL <= wallZ && p.z + t.halfL > wallZ - STEP;
}

interface Box {
    x0: number;
    x1: number;
    z0: number;
    z1: number;
}

function handTrack( boxes: Box[], holes: number[] = [] ): Track {
    const segmentAt = ( i: number ): Segment => {
        const z0 = i * SEG_LEN;
        const z1 = z0 + SEG_LEN;
        const blocks: Block[] = boxes
            .filter( ( b ) => b.z0 >= z0 && b.z0 < z1 )
            .map( ( b, k ) => ( { ...b, y0: 0, y1: BLOCK_HEIGHT, id: blockId( i, k ), kind: 'sealed' } ) );
        const floors = holes.includes( i ) ? [] : [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ];
        return { index: i, z0, z1, kind: blocks.length > 0 ? 'block' : 'plain', floors, blocks, isFinish: false };
    };
    return {
        finishZ: 100 * SEG_LEN,
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ),
        anchors: [],
    };
}

function procTrack( seed: number ): Track {
    return resolveTrack( { kind: 'procgen', seed, tier: 0, length: 400 } );
}

function cachedTrack( track: Track ): Track {
    const cache = new Map< number, Segment >();
    const segmentAt = ( i: number ): Segment => {
        let seg = cache.get( i );
        if ( seg === undefined ) {
            seg = track.segmentAt( i );
            cache.set( i, seg );
        }
        return seg;
    };
    return { ...track, segmentAt, segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ) };
}

function footprintClear( track: Track, x: number, z: number ): boolean {
    const lo = z - t.halfL;
    const hi = z + t.halfL;
    for ( let i = track.segmentAtZ( lo ).index; i <= track.segmentAtZ( hi ).index; i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            if ( x + t.halfW > b.x0 && x - t.halfW < b.x1 && hi > b.z0 && lo < b.z1 ) return false;
        }
    }
    for ( const zs of [ lo + 0.01, z, hi - 0.01 ] ) {
        const seg = track.segmentAtZ( zs );
        const covered = seg.floors.some(
            ( f ) => spanHasZ( seg, f, zs ) && f.x0 <= x - t.halfW && x + t.halfW <= f.x1,
        );
        if ( ! covered ) return false;
    }
    return true;
}

function nearestGridDistance( track: Track, anchor: number, z: number ): number | null {
    let best: number | null = null;
    for ( let x = -LIMIT; x <= LIMIT; x += GRID ) {
        if ( ! footprintClear( track, x, z ) ) continue;
        const d = Math.abs( x - anchor );
        if ( best === null || d < best ) best = d;
    }
    return best;
}

test( 'an open anchor is kept exactly', () => {
    assert.deepEqual( respawnPoint( handTrack( [] ), 3, 210, t ), { x: 3, z: 210 } );
} );

test( 'an anchor past the deck edge is clamped onto the deck', () => {
    assert.deepEqual( respawnPoint( handTrack( [] ), 40, 210, t ), { x: LIMIT, z: 210 } );
} );

test( 'a block over the anchor moves the ship to the nearer side of it', () => {
    const track = handTrack( [ { x0: -2, x1: 6, z0: 200, z1: 212 } ] );
    const left = respawnPoint( track, 0, 205, t );
    assert.equal( left.z, 205 );
    assert.ok( Math.abs( left.x - ( -2 - t.halfW - EDGE ) ) < 1e-9, `moved to x=${ left.x }, not the left face` );
    const right = respawnPoint( track, 5, 205, t );
    assert.equal( right.z, 205 );
    assert.ok( Math.abs( right.x - ( 6 + t.halfW + EDGE ) ) < 1e-9, `moved to x=${ right.x }, not the right face` );
} );

test( 'a block that covers only one end of the footprint still moves the ship', () => {
    const track = handTrack( [ { x0: -2, x1: 6, z0: 200, z1: 204.5 } ] );
    const p = respawnPoint( track, 0, 205.5, t );
    assert.equal( p.z, 205.5 );
    assert.ok( footprintClear( track, p.x, p.z ), `x=${ p.x } still overlaps the block` );
} );

test( 'a wall across the whole deck steps the respawn back one ship length at a time until it clears', () => {
    const track = handTrack( [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, z0: 200, z1: 210 } ] );
    const p = respawnPoint( track, 0, 205, t );
    assert.equal( p.x, 0 );
    assert.ok( justBefore( 200, p ), `stopped at z=${ p.z }, not the first clear step before the wall` );
} );

test( 'a hole under the setback steps the respawn back onto floor', () => {
    const p = respawnPoint( handTrack( [], [ 10 ] ), 0, 210, t );
    assert.equal( p.x, 0 );
    assert.ok( justBefore( 200, p ), `stopped at z=${ p.z }, not the first floor step before the hole` );
} );

test( 'a track walled from end to end still yields a respawn, in front of the first wall', () => {
    const walls: Box[] = [];
    for ( let i = 1; i <= 20; i++ )
        walls.push( { x0: -HALF_WIDTH, x1: HALF_WIDTH, z0: i * SEG_LEN, z1: ( i + 1 ) * SEG_LEN } );
    const p = respawnPoint( handTrack( walls ), 0, 300, t );
    assert.equal( p.x, 0 );
    assert.ok( justBefore( SEG_LEN, p ), `stopped at z=${ p.z }, not the first clear step before the first wall` );
} );

test( 'the start apron has full floor and no blocks on every seed', () => {
    for ( const seed of SEEDS ) {
        const track = procTrack( seed );
        for ( let i = -LEAD_SEGMENTS; i < START_SAFE; i++ ) {
            const seg = track.segmentAt( i );
            assert.equal( seg.blocks.length, 0, `seed ${ seed } segment ${ i } has a block on the apron` );
            assert.ok(
                seg.floors.some( ( f ) => f.x0 <= -HALF_WIDTH && f.x1 >= HALF_WIDTH ),
                `seed ${ seed } segment ${ i } lacks full-width floor`,
            );
        }
    }
} );

test( 'a death near the start respawns on the apron at its anchor', () => {
    for ( const seed of SEEDS ) assert.deepEqual( respawnPoint( procTrack( seed ), 5, -3, t ), { x: 5, z: -3 } );
} );

test( 'the respawn point is identical across two materializations of one descriptor', () => {
    for ( const seed of SEEDS ) {
        const a = procTrack( seed );
        const b = procTrack( seed );
        for ( let i = START_SAFE; i < 400; i += 3 ) {
            for ( const x of [ -30, -11.5, 0, 7.25, 30 ] ) {
                const z = i * SEG_LEN + 9;
                assert.deepEqual( respawnPoint( a, x, z, t ), respawnPoint( b, x, z, t ) );
            }
        }
    }
} );

test( 'on real tracks the respawn point is clear, and no clear x at that z is nearer the anchor', () => {
    for ( const seed of SEEDS ) {
        const track = cachedTrack( procTrack( seed ) );
        for ( let i = START_SAFE; i < 120; i++ ) {
            for ( const anchor of [ -28, -14, 0, 14, 28 ] ) {
                const z = i * SEG_LEN + 7;
                const p = respawnPoint( track, anchor, z, t );
                const label = `seed ${ seed } anchor (${ anchor }, ${ z })`;
                assert.ok(
                    footprintClear( track, p.x, p.z ),
                    `${ label }: chose (${ p.x }, ${ p.z }), which is not clear`,
                );
                for ( let zc = z; zc > p.z; zc -= STEP ) {
                    assert.equal(
                        nearestGridDistance( track, anchor, zc ),
                        null,
                        `${ label }: stepped back past a clear z=${ zc }`,
                    );
                }
                const best = nearestGridDistance( track, anchor, p.z );
                assert.ok( best !== null, `${ label }: the brute scan found no clear x at z=${ p.z }` );
                assert.ok(
                    Math.abs( p.x - anchor ) <= best + 2 * EDGE,
                    `${ label }: chose x=${ p.x }, but a clear x lies ${ best } from the anchor`,
                );
            }
        }
    }
} );
