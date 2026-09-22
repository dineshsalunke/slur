import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING, FIXED_DT } from '../constants.js';
import { emptyInput } from './input.js';
import { BLOCK_HEIGHT, HALF_WIDTH, SEG_LEN, type Segment, type Track } from './space.js';
import { simulate } from './step.js';
import { spawnShip } from './types.js';

const t = DEFAULT_TUNING;
const idle = emptyInput();

function flatTrack( finishSeg: number ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: [],
        isFinish: i >= finishSeg,
    } );
    return {
        finishZ: finishSeg * SEG_LEN,
        segmentAt: seg,
        anchors: [],
        segmentAtZ: ( z: number ) => seg( Math.floor( z / SEG_LEN ) ),
    };
}

function trackWithSeg3( seg3: ( i: number ) => Segment ): Track {
    const plain = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: [],
        isFinish: false,
    } );
    const seg = ( i: number ): Segment => ( i === 3 ? seg3( i ) : plain( i ) );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function cruiseUntilDead( s: ReturnType< typeof spawnShip >, track: Track, ticks = 160 ): void {
    s.vz = t.maxCruise;
    const inp = emptyInput();
    inp.throttle = 1;
    for ( let i = 0; i < ticks && ! s.dead; i++ ) simulate( s, inp, FIXED_DT, t, track );
}

test( 'grounded on a floor resets jumpsUsed and records a safe anchor (jump contract preserved)', () => {
    const s = spawnShip( 3, 0 );
    s.jumpsUsed = 2;
    s.y = 0;
    simulate( s, idle, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.grounded, true );
    assert.equal( s.jumpsUsed, 0 );
    assert.equal( s.y, 0 );
    assert.equal( s.lastSafeX, s.x );
    assert.equal( s.lastSafeZ, s.z );
} );

test( 'fast fall does not tunnel through a floor (swept landing)', () => {
    const s = spawnShip( 0, SEG_LEN * 1.5 );
    s.y = 0.4;
    s.vy = -60;
    s.grounded = false;
    simulate( s, idle, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.grounded, true, 'tunnelled through the floor instead of landing' );
    assert.equal( s.y, 0 );
    assert.equal( s.dead, false );
} );

test( 'AABB wing-clip: a cube the ship CENTER misses but its wing overlaps still kills', () => {
    assert.ok( 0 < 1.0 && 0 + t.halfW > 1.0, 'test setup: centre left of cube, wing overlaps it' );
    const track = trackWithSeg3(
        ( i ): Segment => ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'block',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
            blocks: [ { x0: 1.0, x1: 5.0, y0: 0, y1: BLOCK_HEIGHT, z0: i * SEG_LEN, z1: ( i + 1 ) * SEG_LEN } ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    cruiseUntilDead( s, track );
    assert.ok( s.dead, 'wing overlap did not kill — collision is still point-sampling the centre' );
    assert.ok( s.z < SEG_LEN * 4, 'ship passed the whole cube segment without crashing' );
} );

test( 'AABB wing-clear: the same lateral offset with the cube just past the wing does NOT kill', () => {
    const track = trackWithSeg3(
        ( i ): Segment => ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'block',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
            blocks: [ { x0: 1.4, x1: 5.4, y0: 0, y1: BLOCK_HEIGHT, z0: i * SEG_LEN, z1: ( i + 1 ) * SEG_LEN } ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    cruiseUntilDead( s, track, 200 );
    assert.equal( s.dead, false, 'killed on a clear pass — halfW inflate is too wide' );
    assert.ok( s.z > SEG_LEN * 4, 'ship did not make it past the cube segment' );
} );

test( 'generous grounded: a floor under only PART of the footprint still supports the ship', () => {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: [ { x0: 0, x1: HALF_WIDTH, y: 0 } ],
        blocks: [],
        isFinish: false,
    } );
    const track: Track = {
        finishZ: 1e9,
        segmentAt: seg,
        anchors: [],
        segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ),
    };
    const s = spawnShip( 0, SEG_LEN * 1.5 );
    s.y = 0.4;
    s.vy = -60;
    s.grounded = false;
    simulate( s, idle, FIXED_DT, t, track );
    assert.equal( s.grounded, true, 'partial-footprint support failed (whole-footprint rule?)' );
    assert.equal( s.y, 0 );
} );

test( 'ground-level ship crashes into a full-width cube wall instead of slipping under it', () => {
    const track = trackWithSeg3(
        ( i ): Segment => ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'block',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
            blocks: [
                {
                    x0: -HALF_WIDTH,
                    x1: HALF_WIDTH,
                    y0: 0,
                    y1: BLOCK_HEIGHT,
                    z0: i * SEG_LEN,
                    z1: ( i + 1 ) * SEG_LEN,
                },
            ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    cruiseUntilDead( s, track );
    assert.ok( s.dead, 'ship never crashed — it flew through / slipped under the wall' );
    assert.ok( s.y > t.deathY, `died by falling through (y=${ s.y }) instead of crashing at the face` );
} );

test( 'post-respawn invuln does not let a ship phase through a LATER hazard', () => {
    const track = trackWithSeg3(
        ( i ): Segment => ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'block',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
            blocks: [
                {
                    x0: -HALF_WIDTH,
                    x1: HALF_WIDTH,
                    y0: 0,
                    y1: BLOCK_HEIGHT,
                    z0: i * SEG_LEN,
                    z1: ( i + 1 ) * SEG_LEN,
                },
            ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.2 );
    s.invulnTimer = t.invulnTime;
    cruiseUntilDead( s, track );
    assert.ok( s.dead, 'invuln let the ship phase through the wall' );
    assert.ok( s.z < SEG_LEN * 4, 'ship flew past the wall instead of dying at it' );
} );

test( 'falling through a gap kills, then respawns at the last safe anchor', () => {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: i === 2 ? 'gap' : 'plain',
        floors: i === 2 ? [] : [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: [],
        isFinish: false,
    } );
    const track: Track = {
        finishZ: 1e9,
        segmentAt: seg,
        anchors: [],
        segmentAtZ: ( z: number ) => seg( Math.floor( z / SEG_LEN ) ),
    };
    const s = spawnShip( 0, 0 );
    s.lastSafeX = 0;
    s.lastSafeZ = SEG_LEN * 1.5;
    s.z = SEG_LEN * 2.5;
    s.y = 0;

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

test( 'stun freezes control: throttle is ignored while stunTimer>0, then decrements to 0 and restores control', () => {
    const s = spawnShip( 0, 0 );
    s.stunTimer = 2 * FIXED_DT;
    const inp = emptyInput();
    inp.throttle = 1;

    simulate( s, inp, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.vz, 0, 'stunned ship accelerated — control was not frozen' );
    assert.equal( s.dead, false );
    assert.ok( s.stunTimer > 0 && s.stunTimer <= FIXED_DT + 1e-9, 'stunTimer did not decrement one tick' );

    simulate( s, inp, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.stunTimer, 0, 'stunTimer did not reach 0 after its two ticks' );
    assert.equal( s.vz, 0, 'still frozen on the tick that zeroes the timer' );

    simulate( s, inp, FIXED_DT, t, flatTrack( 100 ) );
    assert.ok( s.vz > 0, 'control was not restored after the stun ended' );
} );

test( 'respawn wakes a derezzed ship unfrozen (stunTimer cleared)', () => {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: i === 2 ? 'gap' : 'plain',
        floors: i === 2 ? [] : [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: [],
        isFinish: false,
    } );
    const track: Track = {
        finishZ: 1e9,
        segmentAt: seg,
        anchors: [],
        segmentAtZ: ( z: number ) => seg( Math.floor( z / SEG_LEN ) ),
    };
    const s = spawnShip( 0, 0 );
    s.lastSafeX = 0;
    s.lastSafeZ = SEG_LEN * 1.5;
    s.z = SEG_LEN * 2.5;
    s.y = 0;
    let ticks = 0;
    while ( ! s.dead && ticks < 300 ) {
        simulate( s, idle, FIXED_DT, t, track );
        ticks++;
    }
    assert.ok( s.dead, 'ship never died over the gap' );
    s.stunTimer = 0.5;
    while ( s.dead && ticks < 400 ) {
        simulate( s, idle, FIXED_DT, t, track );
        ticks++;
    }
    assert.equal( s.dead, false, 'never respawned' );
    assert.equal( s.stunTimer, 0, 'respawn did not clear the stun' );
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

test( 'strafing off the deck edge drops the ship into the void and kills it', () => {
    const s = spawnShip( 0, SEG_LEN * 1.5 );
    s.y = 0;
    const inp = emptyInput();
    inp.strafe = 1;
    for ( let i = 0; i < 400 && ! s.dead; i++ ) simulate( s, inp, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.dead, true, 'the edge still walls the ship in' );
    assert.ok( s.lastSafeX > t.halfWidth - t.halfW - 1, 'died before ever reaching the old clamp' );
} );

test( 'the deck edge holds a ship that overhangs it, and drops one that clears it', () => {
    const hanging = spawnShip( 0, SEG_LEN * 1.5 );
    hanging.x = HALF_WIDTH + t.halfW - 0.1;
    hanging.y = 0;
    simulate( hanging, idle, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( hanging.grounded, true, 'an overhanging ship lost its footing' );

    const clear = spawnShip( 0, SEG_LEN * 1.5 );
    clear.x = HALF_WIDTH + t.halfW + 0.1;
    clear.y = 0;
    simulate( clear, idle, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( clear.grounded, false, 'a ship fully past the edge was still held up' );
} );

test( 'respawn after an edge fall lands fully on the deck, never on the overhang it fell from', () => {
    const s = spawnShip( 0, SEG_LEN * 1.5 );
    s.y = 0;
    const inp = emptyInput();
    inp.strafe = 1;
    for ( let i = 0; i < 400 && ! s.dead; i++ ) simulate( s, inp, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.dead, true, 'never fell off the edge' );
    assert.ok(
        s.lastSafeX > t.halfWidth - t.halfW,
        'test setup: fell from an overhang the old code would restore verbatim',
    );

    for ( let i = 0; i < 400 && s.dead; i++ ) simulate( s, idle, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.dead, false, 'never respawned' );
    assert.ok( Math.abs( s.x ) <= t.halfWidth - t.halfW, `respawned off the deck at x=${ s.x }` );
    assert.equal( s.grounded, true, 'respawned into a death loop instead of onto the deck' );
} );
