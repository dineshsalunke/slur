import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIXED_DT, type FlightTuning } from '../constants.js';
import { SHIP_CLASSES } from '../ship-classes.js';
import { emptyInput } from './input.js';
import { BLOCK_HEIGHT, type Block, HALF_WIDTH, SEG_LEN, type Segment, type Track } from './space.js';
import { simulate } from './step.js';
import { spawnShip } from './types.js';

const BLOCK_Z0 = 3 * SEG_LEN + 5;
const BLOCK_Z1 = BLOCK_Z0 + 10;
const PHASES = 20;

function trackWith( block: Block ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: i === 3 ? 'block' : 'plain',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: i === 3 ? [ block ] : [],
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function pillar( x0: number ): Block {
    return { x0, x1: x0 + 4, y0: 0, y1: BLOCK_HEIGHT, z0: BLOCK_Z0, z1: BLOCK_Z1, id: 3 * 64, kind: 'sealed' };
}

type Outcome = 'glance' | 'stop' | 'miss';

function flyPast( t: FlightTuning, clip: number, phase: number ): Outcome {
    const track = trackWith( pillar( t.halfW - clip ) );
    const step = t.maxCruise * FIXED_DT;
    const s = spawnShip( 0, BLOCK_Z0 - t.halfL - ( 10 + phase ) * step );
    s.vz = t.maxCruise;
    const inp = emptyInput();
    inp.throttle = 1;
    for ( let i = 0; i < 40; i++ ) {
        simulate( s, inp, FIXED_DT, t, track );
        if ( s.stunTimer > 0 ) return s.vz > 0 ? 'glance' : 'stop';
    }
    return 'miss';
}

function sweep( clip: number ): Map< Outcome, number > {
    const tally = new Map< Outcome, number >();
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        for ( let p = 0; p < PHASES; p++ ) {
            const o = flyPast( c.tuning, clip, p / PHASES );
            tally.set( o, ( tally.get( o ) ?? 0 ) + 1 );
        }
    }
    return tally;
}

const RUNS = Object.keys( SHIP_CLASSES ).length * PHASES;

test( 'a clip shallower than grazeDepth glances at every sub-tick phase and every class', () => {
    for ( const clip of [ 0.1, 0.2, 0.3, 0.4, 0.45 ] ) {
        assert.equal( sweep( clip ).get( 'glance' ), RUNS, `clip ${ clip }u did not always glance` );
    }
} );

test( 'a clip at or past grazeDepth hard-stops at every sub-tick phase and every class', () => {
    for ( const clip of [ 0.55, 0.6, 0.7, 0.8 ] ) {
        assert.equal( sweep( clip ).get( 'stop' ), RUNS, `clip ${ clip }u did not always stop` );
    }
} );

test( 'a glance nudges the hull off the face and the ship flies on past the block', () => {
    const t = SHIP_CLASSES.fighter.tuning;
    const track = trackWith( pillar( t.halfW - 0.3 ) );
    const s = spawnShip( 0, BLOCK_Z0 - 10 );
    s.vz = t.maxCruise;
    const inp = emptyInput();
    inp.throttle = 1;
    let bounces = 0;
    for ( let i = 0; i < 60; i++ ) {
        const before = s.stunTimer;
        simulate( s, inp, FIXED_DT, t, track );
        if ( s.stunTimer > before ) bounces += 1;
    }
    assert.equal( bounces, 1 );
    assert.ok( s.x + t.halfW <= t.halfW - 0.3, `hull still overlaps the pillar at x=${ s.x }` );
    assert.ok( s.z - t.halfL > BLOCK_Z1, `ship never cleared the block (z=${ s.z })` );
} );

test( 'strafing into the side of a block resolves on the side face at any depth', () => {
    const t = SHIP_CLASSES.fighter.tuning;
    const track = trackWith( pillar( 5 ) );
    const s = spawnShip( 5 - t.halfW - 0.2, ( BLOCK_Z0 + BLOCK_Z1 ) / 2 );
    s.vz = 20;
    s.vx = t.strafeClamp;
    const inp = emptyInput();
    inp.strafe = 1;
    simulate( s, inp, FIXED_DT, t, track );
    assert.ok( s.stunTimer > 0, 'the strafe never reached the block' );
    assert.equal( s.vx, -t.bounceBack );
    assert.ok( s.vz > 0, `a side hit stopped the ship dead (vz=${ s.vz })` );
    assert.ok( s.x + t.halfW < 5, `hull left inside the block at x=${ s.x }` );
} );
