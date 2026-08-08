// S3 collision contract tests. Deterministic (fixed track + scripted inputs), so they double as a
// desync guard: if the shared step ever diverges here, client prediction and server authority would
// disagree in play. Covers the load-bearing invariants the human feel-gate can't cheaply assert.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING, FIXED_DT } from '../constants.js';
import { emptyInput } from './input.js';
import { simulate } from './step.js';
import { SEG_LEN, type Segment, type Track } from './track.js';
import { spawnShip } from './types.js';

const t = DEFAULT_TUNING;
const idle = emptyInput();

// A hand-built flat track so these tests don't depend on the random generator's layout.
function flatTrack( finishSeg: number ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: [ { x0: -16, x1: 16, y: 0 } ],
        blocks: [],
        isFinish: i >= finishSeg,
    } );
    return {
        seed: 0,
        finishZ: finishSeg * SEG_LEN,
        segmentAt: seg,
        segmentAtZ: ( z: number ) => seg( Math.floor( z / SEG_LEN ) ),
    };
}

test( 'grounded on a floor resets jumpsUsed and records a safe anchor (jump contract preserved)', () => {
    const s = spawnShip( 3, 0 );
    s.jumpsUsed = 2; // airborne bookkeeping; landing must reset it or double-jump breaks
    s.y = 0; // resting on the floor plane; gravity this tick pulls it in → lands
    simulate( s, idle, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.grounded, true );
    assert.equal( s.jumpsUsed, 0 );
    assert.equal( s.y, 0 );
    assert.equal( s.lastSafeX, s.x );
    assert.equal( s.lastSafeZ, s.z );
} );

test( 'falling through a gap kills, then respawns at the last safe anchor', () => {
    // Track: floor everywhere EXCEPT segment 2 is a hole.
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: i === 2 ? 'gap' : 'plain',
        floors: i === 2 ? [] : [ { x0: -16, x1: 16, y: 0 } ],
        blocks: [],
        isFinish: false,
    } );
    const track: Track = {
        seed: 0,
        finishZ: 1e9,
        segmentAt: seg,
        segmentAtZ: ( z: number ) => seg( Math.floor( z / SEG_LEN ) ),
    };
    const s = spawnShip( 0, 0 );
    s.lastSafeX = 0;
    s.lastSafeZ = SEG_LEN * 1.5; // safe ground in segment 1
    s.z = SEG_LEN * 2.5; // over the hole
    s.y = 0; // on the (missing) floor plane → no floor → fall

    // Step until death, then just past respawn — and STOP there (running longer would let it re-enter
    // the same hole and re-die, which isn't what this test asserts).
    let ticks = 0;
    while ( ! s.dead && ticks < 300 ) {
        simulate( s, idle, FIXED_DT, t, track );
        ticks++;
    }
    assert.ok( s.dead, 'ship never died over the gap' );
    while ( s.dead && ticks < 400 ) {
        simulate( s, idle, FIXED_DT, t, track );
        ticks++;
    }
    // Respawned at the last safe anchor, set back, with post-respawn invuln.
    assert.equal( s.dead, false );
    assert.equal( s.x, 0 );
    assert.ok( s.z <= SEG_LEN * 1.5, `respawn z ${ s.z } not set back from anchor` );
    assert.ok( s.invulnTimer > 0, 'no post-respawn invuln' );
} );

test( 'crossing the finish gate latches finished', () => {
    const track = flatTrack( 3 );
    const s = spawnShip( 0, 3 * SEG_LEN - 1 );
    s.vz = 40;
    for ( let i = 0; i < 120 && ! s.finished; i++ ) simulate( s, idle, FIXED_DT, t, track );
    assert.equal( s.finished, true );
} );

test( 'no track → legacy S1 flat floor (solo unchanged): lands at y=0, never dies', () => {
    const s = spawnShip( 0, 0 );
    s.y = 5;
    s.vy = -3;
    for ( let i = 0; i < 300; i++ ) simulate( s, idle, FIXED_DT, t );
    assert.equal( s.grounded, true );
    assert.equal( s.y, 0 );
    assert.equal( s.dead, false );
} );
