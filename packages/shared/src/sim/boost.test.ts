import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canFire, startBoost } from '../combat/combat-step.js';
import { HeldPower } from '../combat/constants.js';
import { FIXED_DT, type FlightTuning } from '../constants.js';
import { ALL_CLASS_TUNINGS } from '../ship-classes.js';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import { emptyInput } from './input.js';
import { HALF_WIDTH, type Segment, type Track } from './space.js';
import { boostCap, simulate } from './step.js';
import { copySimShip, type SimShip, spawnShip } from './types.js';

const cfg = DEFAULT_SIM_CONFIG;
const full = { ...emptyInput(), throttle: 1 };

function steps( seconds: number ): number {
    return Math.round( seconds / FIXED_DT );
}

test( 'boost lifts every class to its own top speed times 1 + gain, within the rise time', () => {
    for ( const t of ALL_CLASS_TUNINGS ) {
        const s = spawnShip();
        s.vz = t.maxCruise;
        startBoost( s );
        for ( let i = 0; i < steps( cfg.boostRiseS ) + 1; i++ ) simulate( s, full, FIXED_DT, t );
        const want = t.maxCruise * ( 1 + cfg.boostGain );
        assert.ok( Math.abs( s.vz - want ) < 1e-6, `top ${ t.maxCruise }: vz ${ s.vz } want ${ want }` );
    }
} );

test( 'boost pushes even with no throttle held', () => {
    const t = ALL_CLASS_TUNINGS[ 0 ];
    const s = spawnShip();
    s.vz = t.maxCruise;
    startBoost( s );
    for ( let i = 0; i < steps( 0.5 ); i++ ) simulate( s, emptyInput(), FIXED_DT, t );
    assert.ok( s.vz > t.maxCruise * 1.39, `vz ${ s.vz }` );
} );

test( 'boost lasts its duration and eases down over the last 0.2 s', () => {
    const t = ALL_CLASS_TUNINGS[ 0 ];
    const s = spawnShip();
    s.vz = t.maxCruise;
    startBoost( s );
    const hold = steps( cfg.boostS - cfg.boostEaseS );
    for ( let i = 0; i < hold; i++ ) simulate( s, full, FIXED_DT, t );
    assert.ok( Math.abs( s.vz - t.maxCruise * ( 1 + cfg.boostGain ) ) < 1e-6, 'lost the boost before the ease' );
    let prev = s.vz;
    for ( let i = 0; i < steps( cfg.boostEaseS ); i++ ) {
        simulate( s, full, FIXED_DT, t );
        assert.ok( s.vz <= prev, `ease step ${ i } rose: ${ s.vz } > ${ prev }` );
        assert.ok( prev - s.vz < t.maxCruise * cfg.boostGain * 0.2, `ease step ${ i } dropped too hard` );
        prev = s.vz;
    }
    simulate( s, full, FIXED_DT, t );
    assert.equal( s.boostTimer, 0 );
    assert.ok( Math.abs( s.vz - t.maxCruise ) < 1e-6, `vz ${ s.vz } after the boost` );
} );

test( 'a second boost resets the timer and adds no speed', () => {
    const t = ALL_CLASS_TUNINGS[ 0 ];
    const s = spawnShip();
    s.vz = t.maxCruise;
    startBoost( s );
    for ( let i = 0; i < steps( 1.5 ); i++ ) simulate( s, full, FIXED_DT, t );
    startBoost( s );
    assert.equal( s.boostTimer, cfg.boostS );
    assert.equal( boostCap( s, t ), t.maxCruise * ( 1 + cfg.boostGain ) );
    for ( let i = 0; i < steps( 1.5 ); i++ ) simulate( s, full, FIXED_DT, t );
    assert.ok( Math.abs( s.vz - t.maxCruise * ( 1 + cfg.boostGain ) ) < 1e-6, `vz ${ s.vz }` );
} );

test( 'a stunned racer cannot use a boost and keeps the charge', () => {
    const g = { x: 0, y: 0, z: 0, slots: [ HeldPower.boost, 0, 0 ], stunTimer: 0.5, dead: false, spectating: false };
    assert.equal( canFire( g, 0 ), false );
    assert.equal( g.slots[ 0 ], HeldPower.boost );
} );

test( 'a stun during a boost stops the push, and the timer keeps running', () => {
    const t = ALL_CLASS_TUNINGS[ 0 ];
    const s = spawnShip();
    s.vz = t.maxCruise * 0.5;
    startBoost( s );
    s.stunTimer = 0.5;
    const vz = s.vz;
    for ( let i = 0; i < steps( 0.25 ); i++ ) simulate( s, full, FIXED_DT, t );
    assert.ok( s.vz <= vz, `a stunned ship gained speed: ${ s.vz } > ${ vz }` );
    assert.ok( Math.abs( s.boostTimer - ( cfg.boostS - 0.25 ) ) < 1e-6, `timer ${ s.boostTimer }` );
} );

test( 'death clears the boost', () => {
    const t = ALL_CLASS_TUNINGS[ 0 ];
    const pit: Segment = { index: 0, z0: -1e6, z1: 1e6, kind: 'plain', floors: [], blocks: [], isFinish: false };
    const track = { segmentAtZ: () => pit } as unknown as Track;
    const s = spawnShip();
    startBoost( s );
    s.y = t.deathY + 1;
    s.vy = -1000;
    for ( let i = 0; i < 4 && ! s.dead; i++ ) simulate( s, full, FIXED_DT, t, track );
    assert.equal( s.dead, true );
    assert.equal( s.boostTimer, 0 );
} );

test( 'a snapshot copied mid-boost replays to the same state', () => {
    const t = ALL_CLASS_TUNINGS[ 0 ];
    const server = spawnShip();
    server.vz = t.maxCruise;
    startBoost( server );
    for ( let i = 0; i < steps( 0.4 ); i++ ) simulate( server, full, FIXED_DT, t );
    const client = spawnShip();
    copySimShip( client, server );
    for ( let i = 0; i < steps( 1 ); i++ ) {
        simulate( server, full, FIXED_DT, t );
        simulate( client, full, FIXED_DT, t );
    }
    assert.deepEqual( client, server );
} );

function gapTrack( gapZ0: number, gapZ1: number ): Track {
    const seg: Segment = {
        index: 0,
        z0: -1e6,
        z1: 1e6,
        kind: 'plain',
        floors: [
            { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0, z0: -1e6, z1: gapZ0 },
            { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0, z0: gapZ1, z1: 1e6 },
        ],
        blocks: [],
        isFinish: false,
    };
    return { segmentAtZ: () => seg, finishZ: 1e7 } as unknown as Track;
}

function fly( s: SimShip, seconds: number, t: FlightTuning, track: Track, input = full ): void {
    for ( let i = 0; i < steps( seconds ) && ! s.dead; i++ ) simulate( s, input, FIXED_DT, t, track );
}

test( 'without a boost a ship at cruise falls into a full gap', () => {
    for ( const t of ALL_CLASS_TUNINGS ) {
        const s = spawnShip();
        s.vz = t.maxCruise;
        fly( s, 1, t, gapTrack( 10, 30 ) );
        assert.equal( s.dead, true, `top ${ t.maxCruise } crossed the gap` );
    }
} );

test( 'a boosted ship holds deck height over a gap and keeps its last safe point on real deck', () => {
    for ( const t of ALL_CLASS_TUNINGS ) {
        const s = spawnShip();
        s.vz = t.maxCruise;
        startBoost( s );
        const track = gapTrack( 10, 150 );
        for ( let i = 0; i < steps( 1.2 ); i++ ) {
            simulate( s, full, FIXED_DT, t, track );
            assert.equal( s.dead, false, `top ${ t.maxCruise } died at z ${ s.z }` );
            assert.equal( s.y, 0 );
        }
        assert.ok( s.z > 150, `top ${ t.maxCruise } only reached z ${ s.z }` );
        const over = spawnShip( 0, 20 );
        over.vz = t.maxCruise;
        startBoost( over );
        fly( over, 0.1, t, gapTrack( 10, 1e5 ) );
        assert.equal( over.grounded, true );
        assert.equal( over.lastSafeZ, 20 );
    }
} );

test( 'gravity resumes after the boost plus the glide grace', () => {
    const t = ALL_CLASS_TUNINGS[ 0 ];
    const s = spawnShip();
    startBoost( s );
    const pit = gapTrack( -1, 1e6 );
    fly( s, cfg.boostS + cfg.boostGlideS - 0.05, t, pit, emptyInput() );
    assert.equal( s.boostTimer, 0 );
    assert.ok( s.glideTimer > 0, `glide ${ s.glideTimer }` );
    assert.equal( s.dead, false );
    assert.equal( s.y, 0 );
    fly( s, 0.6, t, pit, emptyInput() );
    assert.equal( s.dead, true );
} );

test( 'a boosted ship over a gap jumps and double-jumps as on deck, then lands on the boost deck', () => {
    const t = ALL_CLASS_TUNINGS[ 0 ];
    const s = spawnShip();
    startBoost( s );
    const pit = gapTrack( -1, 1e6 );
    fly( s, 0.1, t, pit, emptyInput() );
    simulate( s, { ...emptyInput(), jump: true }, FIXED_DT, t, pit );
    assert.equal( s.vy > 0, true );
    assert.equal( s.jumpsUsed, 1 );
    fly( s, 0.1, t, pit, emptyInput() );
    simulate( s, { ...emptyInput(), jump: true }, FIXED_DT, t, pit );
    assert.equal( s.jumpsUsed, 2 );
    fly( s, 1, t, pit, emptyInput() );
    assert.equal( s.dead, false );
    assert.equal( s.y, 0 );
    assert.equal( s.grounded, true );
    assert.equal( s.jumpsUsed, 0 );
} );

test( 'a boost fired while already falling below the deck does not lift the ship', () => {
    const t = ALL_CLASS_TUNINGS[ 0 ];
    const s = spawnShip();
    s.y = -1;
    s.vy = -5;
    startBoost( s );
    fly( s, 1, t, gapTrack( -1, 1e6 ), emptyInput() );
    assert.equal( s.dead, true );
} );
