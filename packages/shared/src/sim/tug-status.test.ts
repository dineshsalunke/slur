import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catapult, reel, slowTarget, towTarget } from '../combat/tug.js';
import { FIXED_DT } from '../constants.js';
import { tuningForShip } from '../ship-classes.js';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import { emptyInput } from './input.js';
import { simulate } from './step.js';
import { clearStatus } from './tug-status.js';
import { copySimShip, froundSimShip, spawnShip } from './types.js';

const cfg = DEFAULT_SIM_CONFIG;
const full = { ...emptyInput(), throttle: 1 };
const SHIP = 'executioner';
const t = tuningForShip( SHIP );

function steps( seconds: number ): number {
    return Math.round( seconds / FIXED_DT );
}

function cruising() {
    const s = { ...spawnShip(), shipId: SHIP };
    s.vz = t.maxCruise;
    return s;
}

function fly( s: ReturnType< typeof cruising >, seconds: number, input = full ): void {
    for ( let i = 0; i < steps( seconds ); i++ ) simulate( s, input, FIXED_DT, t, undefined, cfg );
}

test( 'catapult adds the kick above top speed and holds it under the lifted cap', () => {
    const s = cruising();
    catapult( s, cfg );
    fly( s, 0.1 );
    const cap = t.maxCruise * ( 1 + cfg.tugGain );
    assert.ok( s.vz > t.maxCruise + cfg.tugKick * 0.9, `vz ${ s.vz }` );
    assert.ok( s.vz <= cap + 1e-6, `vz ${ s.vz } cap ${ cap }` );
} );

test( 'catapult eases back to top speed after the tug ends', () => {
    const s = cruising();
    catapult( s, cfg );
    fly( s, cfg.tugS + 0.2 );
    assert.equal( s.tugTimer, 0 );
    assert.ok( Math.abs( s.vz - t.maxCruise ) < 1e-6, `vz ${ s.vz }` );
} );

test( 'slow cuts speed and caps the target below top speed for its duration', () => {
    const s = cruising();
    slowTarget( s, cfg );
    assert.ok( Math.abs( s.vz - t.maxCruise * cfg.tugSpeedCut ) < 1e-9 );
    fly( s, cfg.tugSlowS * 0.8 );
    assert.ok( s.vz <= t.maxCruise * cfg.slowCap + 1e-6, `vz ${ s.vz }` );
    fly( s, cfg.tugSlowS );
    assert.equal( s.slowTimer, 0 );
    assert.ok( s.vz > t.maxCruise * cfg.slowCap, `vz ${ s.vz }` );
} );

test( 'slow and tow are shortened by armour', () => {
    const s = { ...spawnShip(), shipId: 'bob' };
    slowTarget( s, cfg );
    towTarget( s, cfg );
    assert.ok( Math.abs( s.slowTimer - cfg.tugSlowS * 0.9 ) < 1e-9, `slow ${ s.slowTimer }` );
    assert.ok( Math.abs( s.towTimer - cfg.towS * 0.9 ) < 1e-9, `tow ${ s.towTimer }` );
} );

test( 'tow pulls the chaser forward and degrades its strafe', () => {
    const towed = cruising();
    const free = cruising();
    towTarget( towed, cfg );
    assert.equal( towed.vz, t.maxCruise + cfg.towKick );
    const right = { ...full, strafe: 1 };
    fly( towed, 0.1, right );
    fly( free, 0.1, right );
    assert.ok( towed.vz > t.maxCruise, `vz ${ towed.vz }` );
    assert.ok( Math.abs( towed.vx ) < Math.abs( free.vx ), `towed ${ towed.vx } free ${ free.vx }` );
} );

test( 'tow blocks the jump unless the dial allows it', () => {
    const jump = { ...full, jump: true };
    const blocked = cruising();
    towTarget( blocked, cfg );
    fly( blocked, 0.1, jump );
    assert.equal( blocked.y, 0 );
    const allowed = cruising();
    towTarget( allowed, cfg );
    const open = { ...cfg, towJump: true };
    for ( let i = 0; i < steps( 0.1 ); i++ ) simulate( allowed, jump, FIXED_DT, t, undefined, open );
    assert.ok( allowed.y > 0, `y ${ allowed.y }` );
} );

test( 'tow strafe scale 0 disables strafe', () => {
    const s = cruising();
    towTarget( s, cfg );
    const off = { ...cfg, towStrafeScale: 0 };
    for ( let i = 0; i < steps( 0.1 ); i++ ) simulate( s, { ...full, strafe: 1 }, FIXED_DT, t, undefined, off );
    assert.equal( s.vx, 0 );
} );

test( 'a block reel lets go once the anchor is closer than the release time', () => {
    const s = cruising();
    const anchorZ = 90;
    reel( s, anchorZ, cfg );
    let released = -1;
    for ( let i = 0; i < steps( cfg.tugS ) && released < 0; i++ ) {
        simulate( s, full, FIXED_DT, t, undefined, cfg );
        if ( s.tugAnchorZ === 0 ) released = anchorZ - ( s.z + t.halfL );
    }
    assert.ok( released > 0, `released at gap ${ released }` );
    assert.ok( released <= s.vz * cfg.tugReleaseS, `gap ${ released } vz ${ s.vz }` );
    assert.ok( released > s.vz * cfg.tugReleaseS - s.vz * FIXED_DT * 2, `gap ${ released } vz ${ s.vz }` );
    assert.ok( s.tugTimer > 0 && s.tugTimer <= cfg.tugEaseS, `tug ${ s.tugTimer }` );
} );

test( 'a reel on a far anchor runs its full time and then clears the anchor', () => {
    const s = cruising();
    reel( s, 1e6, cfg );
    fly( s, cfg.tugS + 0.05 );
    assert.equal( s.tugTimer, 0 );
    assert.equal( s.tugAnchorZ, 0 );
} );

test( 'the tug fields replay identically through a copied ship', () => {
    const server = cruising();
    catapult( server, cfg );
    slowTarget( server, cfg );
    towTarget( server, cfg );
    const client = { ...spawnShip(), shipId: SHIP };
    copySimShip( client, server );
    fly( server, 0.4 );
    fly( client, 0.4 );
    assert.deepEqual( client, server );
} );

test( 'clear and fround reach every tug field', () => {
    const s = cruising();
    s.tugTimer = 0.1;
    s.slowTimer = 0.1;
    s.towTimer = 0.1;
    s.tugAnchorZ = 0.1;
    froundSimShip( s );
    assert.equal( s.tugTimer, Math.fround( 0.1 ) );
    assert.equal( s.tugAnchorZ, Math.fround( 0.1 ) );
    s.boostTimer = 0.1;
    clearStatus( s );
    assert.deepEqual( [ s.boostTimer, s.tugTimer, s.slowTimer, s.towTimer, s.tugAnchorZ ], [ 0, 0, 0, 0, 0 ] );
} );
