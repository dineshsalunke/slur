import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING, FIXED_DT } from '../constants.js';
import { emptyInput } from './input.js';
import { BLOCK_HEIGHT, type Block, HALF_WIDTH, SEG_LEN, type Segment, type Track } from './space.js';
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

function sealedBox( x0: number, x1: number, i: number ): Block {
    return { x0, x1, y0: 0, y1: BLOCK_HEIGHT, z0: i * SEG_LEN, z1: ( i + 1 ) * SEG_LEN, id: i * 64, kind: 'sealed' };
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

function cruiseUntilHit( s: ReturnType< typeof spawnShip >, track: Track, ticks = 160 ): void {
    s.vz = t.maxCruise;
    const inp = emptyInput();
    inp.throttle = 1;
    for ( let i = 0; i < ticks && ! s.dead && s.stunTimer === 0; i++ ) simulate( s, inp, FIXED_DT, t, track );
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

test( 'AABB wing-clip: a cube the ship CENTER misses but its wing overlaps still hits', () => {
    assert.ok( 0 < 1.0 && 0 + t.halfW > 1.0, 'test setup: centre left of cube, wing overlaps it' );
    const track = trackWithSeg3(
        ( i ): Segment => ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'block',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
            blocks: [ sealedBox( 1.0, 5.0, i ) ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    cruiseUntilHit( s, track );
    assert.ok( s.stunTimer > 0, 'wing overlap did not hit — collision is still point-sampling the centre' );
    assert.equal( s.dead, false, 'a block hit killed instead of bouncing' );
    assert.ok( s.x + t.halfW <= 1.0 + 1e-3, `wing was not pushed clear of the cube face (x=${ s.x })` );
    assert.ok( s.z < SEG_LEN * 4, 'ship passed the whole cube segment without touching it' );
} );

test( 'AABB wing-clear: the same lateral offset with the cube just past the wing does NOT hit', () => {
    const track = trackWithSeg3(
        ( i ): Segment => ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'block',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
            blocks: [ sealedBox( 1.4, 5.4, i ) ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    cruiseUntilHit( s, track, 200 );
    assert.equal( s.stunTimer, 0, 'hit on a clear pass — halfW inflate is too wide' );
    assert.equal( s.dead, false, 'killed on a clear pass' );
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

test( 'ground-level ship stops dead at a full-width cube wall instead of slipping under it', () => {
    const track = trackWithSeg3(
        ( i ): Segment => ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'block',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
            blocks: [ sealedBox( -HALF_WIDTH, HALF_WIDTH, i ) ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    cruiseUntilHit( s, track );
    assert.ok( s.stunTimer > 0, 'ship never hit the wall — it flew through / slipped under it' );
    assert.equal( s.dead, false, 'a wall hit killed instead of bouncing' );
    assert.ok( s.y > t.deathY, `fell through (y=${ s.y }) instead of stopping at the face` );
    assert.ok( s.z + t.halfL <= SEG_LEN * 3 + 1e-2, `ship sits inside the wall at z=${ s.z }` );
    assert.ok( s.vz <= 0, `ship kept driving forward into the wall (vz=${ s.vz })` );
} );

test( 'the bounce shoves the ship back off the face and the stun holds control for a moment', () => {
    const track = trackWithSeg3(
        ( i ): Segment => ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'block',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
            blocks: [ sealedBox( -HALF_WIDTH, HALF_WIDTH, i ) ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    cruiseUntilHit( s, track );
    assert.equal( s.vz, -t.bounceBack, 'the hit did not reverse the ship off the face' );
    assert.equal( s.stunTimer, t.bounceStun, 'the hit did not stun' );

    const zAtHit = s.z;
    const inp = emptyInput();
    inp.throttle = 1;
    simulate( s, inp, FIXED_DT, t, track );
    assert.ok( s.z < zAtHit, 'the ship did not travel backwards on the tick after the hit' );
    assert.ok( s.vz < 0, 'throttle beat the stun and cancelled the knockback' );

    for ( let i = 0; i < 20; i++ ) simulate( s, idle, FIXED_DT, t, track );
    assert.equal( s.stunTimer, 0, 'the stun never ended' );
    assert.equal( s.vz, 0, 'the knockback never drained away' );

    simulate( s, inp, FIXED_DT, t, track );
    assert.ok( s.vz > 0, 'control never came back after the stun' );
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
    assert.ok( s.lastSafeX > HALF_WIDTH - t.halfW - 1, 'died before ever reaching the old clamp' );
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
        s.lastSafeX > HALF_WIDTH - t.halfW,
        'test setup: fell from an overhang the old code would restore verbatim',
    );

    for ( let i = 0; i < 400 && s.dead; i++ ) simulate( s, idle, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.dead, false, 'never respawned' );
    assert.ok( Math.abs( s.x ) <= HALF_WIDTH - t.halfW, `respawned off the deck at x=${ s.x }` );
    assert.equal( s.grounded, true, 'respawned into a death loop instead of onto the deck' );
} );
