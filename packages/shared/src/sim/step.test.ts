// Collision contract tests. Deterministic (fixed track + scripted inputs), so they double as a desync
// guard: if the shared step ever diverges here, client prediction and server authority would disagree in
// play. Covers the load-bearing invariants the human feel-gate can't cheaply assert.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING, DRAG_SPEED_FRAC, FIXED_DT } from '../constants.js';
import { emptyInput } from './input.js';
import { simulate } from './step.js';
import { BLOCK_HEIGHT, HALF_WIDTH, SEG_LEN, type Segment, type Track } from './track.js';
import { spawnShip } from './types.js';

const t = DEFAULT_TUNING; // Fighter: halfW 1.3, halfL 1.26
const idle = emptyInput();

// A hand-built flat full-width track so these tests don't depend on the random generator's layout.
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
        anchors: [], // ADR-002: Track requires anchors; collision mocks carry no pickups.
        segmentAtZ: ( z: number ) => seg( Math.floor( z / SEG_LEN ) ),
    };
}

// A track where segment 3 differs; every other segment is flat full-width plain. Keeps the many collision
// scenarios one-liners.
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

// Drive the ship forward through the track until it dies or the tick budget runs out.
function cruiseUntilDead( s: ReturnType< typeof spawnShip >, track: Track, ticks = 160 ): void {
    s.vz = t.maxCruise;
    const inp = emptyInput();
    inp.throttle = 1;
    for ( let i = 0; i < ticks && ! s.dead; i++ ) simulate( s, inp, FIXED_DT, t, track );
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

test( 'fast fall does not tunnel through a floor (swept landing)', () => {
    // Regression: a descent fast enough to overshoot the floor top by more than stepTol in one tick used to
    // skip the point-sample landing check and fall to its death. The swept test must catch it.
    const s = spawnShip( 0, SEG_LEN * 1.5 );
    s.y = 0.4; // just above the floor at y=0
    s.vy = -60; // one tick drops ~0.6u past the top — well beyond stepTol (0.3)
    s.grounded = false;
    simulate( s, idle, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.grounded, true, 'tunnelled through the floor instead of landing' );
    assert.equal( s.y, 0 );
    assert.equal( s.dead, false );
} );

test( 'AABB wing-clip: a cube the ship CENTER misses but its wing overlaps still kills', () => {
    // Cube occupies x ∈ [1.0, 5.0] (right of centre). Ship cruises at x=0 — centre is OUTSIDE the cube
    // (a point-sample would survive) but the wing reaches x = +halfW (1.3) > 1.0 → footprint overlaps → crash.
    assert.ok( 0 < 1.0 && 0 + t.halfW > 1.0, 'test setup: centre left of cube, wing overlaps it' );
    const track = trackWithSeg3(
        ( i ): Segment => ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'block',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
            blocks: [
                { x0: 1.0, x1: 5.0, y0: 0, y1: BLOCK_HEIGHT, z0: i * SEG_LEN, z1: ( i + 1 ) * SEG_LEN, lethal: true },
            ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    cruiseUntilDead( s, track );
    assert.ok( s.dead, 'wing overlap did not kill — collision is still point-sampling the centre' );
    assert.ok( s.z < SEG_LEN * 4, 'ship passed the whole cube segment without crashing' );
} );

test( 'AABB wing-clear: the same lateral offset with the cube just past the wing does NOT kill', () => {
    // Cube at x ∈ [1.4, 5.4]: the wing tip (1.3) is just short of 1.4 → NO overlap → the ship threads past.
    // Guards against an over-eager inflate (halfW too large) that would kill a legitimately-clear pass.
    const track = trackWithSeg3(
        ( i ): Segment => ( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: 'block',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
            blocks: [
                { x0: 1.4, x1: 5.4, y0: 0, y1: BLOCK_HEIGHT, z0: i * SEG_LEN, z1: ( i + 1 ) * SEG_LEN, lethal: true },
            ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    cruiseUntilDead( s, track, 200 );
    assert.equal( s.dead, false, 'killed on a clear pass — halfW inflate is too wide' );
    assert.ok( s.z > SEG_LEN * 4, 'ship did not make it past the cube segment' );
} );

test( 'generous grounded: a floor under only PART of the footprint still supports the ship', () => {
    // Floor covers x ∈ [0, HALF_WIDTH] only (left half is void). Ship at x=0: left wing over the void, right
    // wing over floor → ANY part on floor ⇒ grounded. A "whole footprint must be on floor" rule would fall.
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
        anchors: [], // ADR-002: Track requires anchors; collision mocks carry no pickups.
        segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ),
    };
    const s = spawnShip( 0, SEG_LEN * 1.5 );
    s.y = 0.4;
    s.vy = -60; // land in one tick, isolating the partial-floor x-overlap (not the descent rate)
    s.grounded = false;
    simulate( s, idle, FIXED_DT, t, track );
    assert.equal( s.grounded, true, 'partial-footprint support failed (whole-footprint rule?)' );
    assert.equal( s.y, 0 );
} );

test( 'ground-level ship crashes into a full-width cube wall instead of slipping under it', () => {
    // Regression: a body cruised into at y≈0 got nudged just under its base (y0=0) by one tick of gravity and
    // slipped beneath a point-sample check → fell through the track. The swept lower bound must catch it.
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
                    lethal: true,
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
    // Regression: blind time-based invuln let a freshly-respawned ship fly straight through the next wall.
    // Grace is now position-scoped — it ends the first tick the ship is clear of every body (seg 2 is open),
    // so the lethal wall in seg 3 still kills it.
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
                    lethal: true,
                },
            ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.2 ); // grounded on open plain seg 2
    s.invulnTimer = t.invulnTime; // as if it just respawned elsewhere
    cruiseUntilDead( s, track );
    assert.ok( s.dead, 'invuln let the ship phase through the wall' );
    assert.ok( s.z < SEG_LEN * 4, 'ship flew past the wall instead of dying at it' );
} );

test( 'a DRAG (amber) block slows the ship instead of killing it', () => {
    // Full-width drag block in seg 3: the ship can't avoid it, so it MUST survive (passable) and its forward
    // speed is clamped to DRAG_SPEED_FRAC · maxCruise while inside — the whole point of the non-lethal hazard.
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
                    lethal: false,
                },
            ],
            isFinish: false,
        } ),
    );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    s.vz = t.maxCruise;
    const inp = emptyInput();
    inp.throttle = 1; // hold full throttle — the drag must still cap speed while inside
    let sawInside = false;
    for ( let i = 0; i < 160 && s.z < SEG_LEN * 4; i++ ) {
        simulate( s, inp, FIXED_DT, t, track );
        if ( s.z >= SEG_LEN * 3 && s.z < SEG_LEN * 4 ) {
            sawInside = true;
            assert.ok(
                s.vz <= DRAG_SPEED_FRAC * t.maxCruise + 1e-6,
                `inside drag block but vz ${ s.vz } > cap ${ DRAG_SPEED_FRAC * t.maxCruise }`,
            );
        }
    }
    assert.ok( sawInside, 'ship never entered the drag segment' );
    assert.equal( s.dead, false, 'a drag block killed the ship — it must only slow it' );
    assert.ok( s.z >= SEG_LEN * 4, 'ship got stuck in the drag block instead of passing through' );
} );

test( 'falling through a gap kills, then respawns at the last safe anchor', () => {
    // Track: floor everywhere EXCEPT segment 2 is a hole.
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
        anchors: [], // ADR-002: Track requires anchors; collision mocks carry no pickups.
        segmentAtZ: ( z: number ) => seg( Math.floor( z / SEG_LEN ) ),
    };
    const s = spawnShip( 0, 0 );
    s.lastSafeX = 0;
    s.lastSafeZ = SEG_LEN * 1.5; // safe ground in segment 1
    s.z = SEG_LEN * 2.5; // over the hole
    s.y = 0; // on the (missing) floor plane → no floor → fall

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
    s.stunTimer = 2 * FIXED_DT; // exactly two ticks of stun
    const inp = emptyInput();
    inp.throttle = 1; // would normally accelerate forward

    simulate( s, inp, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.vz, 0, 'stunned ship accelerated — control was not frozen' );
    assert.equal( s.dead, false ); // physics still ran; it just coasted
    assert.ok( s.stunTimer > 0 && s.stunTimer <= FIXED_DT + 1e-9, 'stunTimer did not decrement one tick' );

    simulate( s, inp, FIXED_DT, t, flatTrack( 100 ) );
    assert.equal( s.stunTimer, 0, 'stunTimer did not reach 0 after its two ticks' );
    assert.equal( s.vz, 0, 'still frozen on the tick that zeroes the timer' );

    simulate( s, inp, FIXED_DT, t, flatTrack( 100 ) );
    assert.ok( s.vz > 0, 'control was not restored after the stun ended' );
} );

test( 'respawn wakes a derezzed ship unfrozen (stunTimer cleared)', () => {
    // Fall through a gap to die, then stamp a stun onto the DEAD ship (the dead branch doesn't touch it),
    // and let it respawn — the wake must clear the stun so a revived ship isn't frozen at the anchor.
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
        anchors: [], // ADR-002: Track requires anchors; collision mocks carry no pickups.
        segmentAtZ: ( z: number ) => seg( Math.floor( z / SEG_LEN ) ),
    };
    const s = spawnShip( 0, 0 );
    s.lastSafeX = 0;
    s.lastSafeZ = SEG_LEN * 1.5;
    s.z = SEG_LEN * 2.5; // over the hole
    s.y = 0;
    let ticks = 0;
    while ( ! s.dead && ticks < 300 ) {
        simulate( s, idle, FIXED_DT, t, track );
        ticks++;
    }
    assert.ok( s.dead, 'ship never died over the gap' );
    s.stunTimer = 0.5; // hit right before derezz; dead-branch leaves it untouched until respawn
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
