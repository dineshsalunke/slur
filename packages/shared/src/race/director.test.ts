// Headless gate for the S4 race brain. Run via `pnpm --filter @slur/shared test` (tsc → node --test on
// compiled dist). These are hard gates: standings order, race-end conditions, and the reset invariants are
// what make results correct and a fresh round actually fresh.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COLOR_COUNT, MAX_RACE_SECONDS, RACE_GRACE_SECONDS, START_STAGGER } from '../constants.js';
import {
    computeStandings,
    isColorId,
    PHASE,
    raceShouldEnd,
    resetPlayerForRace,
    type StandingInput,
    shouldSpectateOnJoin,
} from './director.js';

function racer( over: Partial< StandingInput > ): StandingInput {
    return {
        id: 'x',
        name: 'x',
        colorId: 0,
        shipId: 'challenger',
        spectating: false,
        finished: false,
        finishTime: 0,
        z: 0,
        ...over,
    };
}

test( 'standings: finishers rank before non-finishers, by finishTime ascending', () => {
    const s = computeStandings( [
        racer( { id: 'dnf', finished: false, z: 500 } ),
        racer( { id: 'slow', finished: true, finishTime: 42 } ),
        racer( { id: 'fast', finished: true, finishTime: 30 } ),
    ] );
    assert.deepEqual(
        s.map( ( r ) => r.id ),
        [ 'fast', 'slow', 'dnf' ],
    );
    assert.deepEqual(
        s.map( ( r ) => r.rank ),
        [ 1, 2, 3 ],
    );
    assert.deepEqual(
        s.map( ( r ) => r.dnf ),
        [ false, false, true ],
    );
} );

test( 'standings: both DNF → further along the track (z) ranks higher', () => {
    const s = computeStandings( [
        racer( { id: 'behind', finished: false, z: 100 } ),
        racer( { id: 'ahead', finished: false, z: 900 } ),
    ] );
    assert.deepEqual(
        s.map( ( r ) => r.id ),
        [ 'ahead', 'behind' ],
    );
} );

test( 'standings: spectators are excluded from the ranking', () => {
    const s = computeStandings( [
        racer( { id: 'racer', finished: true, finishTime: 10 } ),
        racer( { id: 'watcher', spectating: true, finished: true, finishTime: 1 } ),
    ] );
    assert.deepEqual(
        s.map( ( r ) => r.id ),
        [ 'racer' ],
    );
} );

test( 'raceShouldEnd: whole field finished ends immediately', () => {
    assert.equal( raceShouldEnd( { elapsed: 5, finishDeadline: 0, racerCount: 3, finishedCount: 3 } ), true );
} );

test( 'raceShouldEnd: leader grace window governs the tail', () => {
    const deadline = 10 + RACE_GRACE_SECONDS;
    // during the grace window → keep racing
    assert.equal( raceShouldEnd( { elapsed: 15, finishDeadline: deadline, racerCount: 3, finishedCount: 1 } ), false );
    // grace expired → results
    assert.equal(
        raceShouldEnd( { elapsed: deadline, finishDeadline: deadline, racerCount: 3, finishedCount: 1 } ),
        true,
    );
} );

test( 'raceShouldEnd: no deadline set and mid-race → keep going; safety cap ends a finisher-less race', () => {
    assert.equal( raceShouldEnd( { elapsed: 60, finishDeadline: 0, racerCount: 2, finishedCount: 0 } ), false );
    assert.equal(
        raceShouldEnd( { elapsed: MAX_RACE_SECONDS, finishDeadline: 0, racerCount: 2, finishedCount: 0 } ),
        true,
    );
} );

test( 'raceShouldEnd: empty field ends (everyone left)', () => {
    assert.equal( raceShouldEnd( { elapsed: 5, finishDeadline: 0, racerCount: 0, finishedCount: 0 } ), true );
} );

test( 'resetPlayerForRace: zeroes transient state, staggers x by seat, re-anchors safe point', () => {
    const dirty = {
        x: 999,
        y: 12,
        z: 4000,
        vx: 5,
        vy: -3,
        vz: 55,
        grounded: false,
        jumpsUsed: 2,
        jumpHeld: true,
        coyoteTimer: 0.4,
        bufferTimer: 0.2,
        dead: true,
        respawnTimer: 1,
        invulnTimer: 1.5,
        lastSafeX: 40,
        lastSafeZ: 3900,
        finished: true,
        finishTime: 88,
        stunTimer: 0.9,
    };
    resetPlayerForRace( dirty, 3 );
    assert.equal( dirty.x, 3 * START_STAGGER );
    assert.equal( dirty.lastSafeX, 3 * START_STAGGER );
    assert.deepEqual(
        [ dirty.y, dirty.z, dirty.vx, dirty.vy, dirty.vz, dirty.lastSafeZ, dirty.finishTime, dirty.stunTimer ],
        [ 0, 0, 0, 0, 0, 0, 0, 0 ],
    );
    assert.equal( dirty.finished, false );
    assert.equal( dirty.dead, false );
    assert.equal( dirty.grounded, true );
    assert.equal( dirty.jumpsUsed, 0 );
} );

test( 'shouldSpectateOnJoin: Race policy — only lobby joins race, everything else spectates', () => {
    assert.equal( shouldSpectateOnJoin( PHASE.lobby ), false );
    assert.equal( shouldSpectateOnJoin( PHASE.countdown ), true );
    assert.equal( shouldSpectateOnJoin( PHASE.racing ), true );
    assert.equal( shouldSpectateOnJoin( PHASE.finished ), true );
} );

test( 'isColorId: accepts palette range, rejects out-of-range / non-integer', () => {
    assert.equal( isColorId( 0 ), true );
    assert.equal( isColorId( COLOR_COUNT - 1 ), true );
    assert.equal( isColorId( COLOR_COUNT ), false );
    assert.equal( isColorId( -1 ), false );
    assert.equal( isColorId( 1.5 ), false );
    assert.equal( isColorId( '2' ), false );
} );
