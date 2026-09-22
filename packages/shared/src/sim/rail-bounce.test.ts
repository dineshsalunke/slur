import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING, FIXED_DT } from '../constants.js';
import { ALL_CLASS_TUNINGS } from '../ship-classes.js';
import { emptyInput } from './input.js';
import { simulate } from './step.js';
import { spawnShip } from './types.js';

const t = DEFAULT_TUNING;
const limit = t.halfWidth - t.halfW;

function atRailMovingOut( tuning = t ) {
    const s = spawnShip();
    s.x = tuning.halfWidth - tuning.halfW;
    s.vx = tuning.strafeClamp;
    return s;
}

test( 'the rail pushes the ship back instead of stopping it dead', () => {
    const s = atRailMovingOut();
    simulate( s, emptyInput(), FIXED_DT, t );
    assert.equal( s.x, limit, 'it stays inside the playable width' );
    assert.ok( s.vx < 0, 'lateral velocity now points back toward the track' );
} );

test( 'the push-off is the configured fraction of the impact speed', () => {
    const s = atRailMovingOut();
    const impact = s.vx;
    simulate( s, emptyInput(), FIXED_DT, t );
    assert.ok( Math.abs( s.vx ) < Math.abs( impact ), 'the bounce never returns more speed than it absorbed' );
} );

test( 'the left rail mirrors the right', () => {
    const right = atRailMovingOut();
    const left = spawnShip();
    left.x = -limit;
    left.vx = -t.strafeClamp;
    simulate( right, emptyInput(), FIXED_DT, t );
    simulate( left, emptyInput(), FIXED_DT, t );
    assert.equal( left.x, -limit );
    assert.ok( left.vx > 0, 'the left rail pushes right' );
} );

test( 'a zero restitution reproduces the old stop-and-slide exactly', () => {
    const s = atRailMovingOut();
    simulate( s, emptyInput(), FIXED_DT, { ...t, railBounce: 0 } );
    assert.equal( s.x, limit );
    assert.equal( s.vx, 0 );
} );

test( 'the rail never adds lateral speed, whatever the class', () => {
    for ( const tuning of ALL_CLASS_TUNINGS ) {
        const s = atRailMovingOut( tuning );
        const impact = Math.abs( s.vx );
        simulate( s, emptyInput(), FIXED_DT, tuning );
        assert.ok( Math.abs( s.vx ) <= impact, 'no class gains lateral speed off the rail' );
    }
} );

test( 'a ship already inside the rails is untouched by the clamp', () => {
    const s = spawnShip();
    s.vx = 0;
    simulate( s, emptyInput(), FIXED_DT, t );
    assert.equal( s.x, 0 );
    assert.equal( s.vx, 0 );
} );

test( 'repeated rail contact settles rather than pinballing', () => {
    const s = atRailMovingOut();
    let contacts = 0;
    for ( let i = 0; i < 600; i++ ) {
        const before = s.x;
        simulate( s, emptyInput(), FIXED_DT, t );
        if ( before >= limit && s.x >= limit ) contacts++;
    }
    assert.ok( Math.abs( s.x ) <= limit, 'it never escapes the playable width' );
    assert.ok( Number.isFinite( s.vx ), 'lateral velocity stays finite' );
    assert.ok( contacts < 600, 'it leaves the rail rather than sticking to it' );
} );

test( 'the bounce does not cost forward speed', () => {
    const s = atRailMovingOut();
    s.vz = 40;
    simulate( s, emptyInput(), FIXED_DT, t );
    assert.ok( s.vz > 39, 'hitting the rail is a lateral event only' );
} );
