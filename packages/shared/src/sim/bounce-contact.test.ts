import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TUNING } from '../constants.js';
import { bounceContact } from './bounce-contact.js';
import { spawnShip } from './types.js';

const t = DEFAULT_TUNING;

test( 'no contact is not a bounce', () => {
    const s = spawnShip( 0, 50 );
    s.stunTimer = t.bounceStun;
    assert.equal( bounceContact( s, null, t ), null );
} );

test( 'a dead ship reports no contact', () => {
    const s = spawnShip( 0, 50 );
    s.dead = true;
    assert.equal( bounceContact( s, { kind: 'hit', dir: -1 }, t ), null );
} );

test( 'a head-on hit reports the front face', () => {
    const s = spawnShip( 3, 50 );
    assert.deepEqual( bounceContact( s, { kind: 'hit', dir: -1 }, t ), { x: 3, y: s.y, z: 50 + t.halfL } );
} );

test( 'a side scrape reports the face opposite the push, even with no strafe', () => {
    const s = spawnShip( 3, 50 );
    s.vx = 0;
    assert.deepEqual( bounceContact( s, { kind: 'scrape', dir: -1 }, t ), { x: 3 + t.halfW, y: s.y, z: 50 } );
} );
