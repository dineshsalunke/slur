import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING, FIXED_DT } from '../constants.js';
import { bounceContact } from './bounce-contact.js';
import { spawnShip } from './types.js';

const t = DEFAULT_TUNING;

test( 'a stun that only counts down is not a bounce', () => {
    const s = spawnShip( 0, 50 );
    s.stunTimer = 0.5 - FIXED_DT;
    assert.equal( bounceContact( s, 0.5, 40, FIXED_DT, t ), null );
} );

test( 'no stun at all is not a bounce', () => {
    const s = spawnShip( 0, 50 );
    assert.equal( bounceContact( s, 0, 40, FIXED_DT, t ), null );
} );

test( 'a dead ship reports no contact', () => {
    const s = spawnShip( 0, 50 );
    s.stunTimer = t.bounceStun;
    s.dead = true;
    assert.equal( bounceContact( s, 0, 40, FIXED_DT, t ), null );
} );

test( 'a head-on bounce reports the front face', () => {
    const s = spawnShip( 3, 50 );
    s.stunTimer = t.bounceStun;
    s.vz = -t.bounceBack;
    const c = bounceContact( s, 0, 40, FIXED_DT, t );
    assert.deepEqual( c, { x: 3, y: s.y, z: 50 + t.halfL } );
} );

test( 'a side bounce reports the face opposite the push', () => {
    const s = spawnShip( 3, 50 );
    s.stunTimer = t.bounceStun;
    s.vz = 40;
    s.vx = -t.bounceBack;
    const c = bounceContact( s, 0, 40, FIXED_DT, t );
    assert.deepEqual( c, { x: 3 + t.halfW, y: s.y, z: 50 } );
} );
