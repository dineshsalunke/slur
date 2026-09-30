import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { HitShip, ProjectileState } from '../../combat/projectiles.js';
import { DEFAULT_SIM_CONFIG } from '../../sim-config.js';
import { boltHits, stepProjectiles } from './bolt.js';
import { BOLT_HALF, BOLT_SPEED } from './bolt-constants.js';

const DT = 1 / 60;

function victim( over: Partial< HitShip > = {} ): HitShip {
    return { id: 'v', x: 0, y: 0, z: 0, halfW: 1.3, halfL: 1.26, dead: false, spectating: false, ...over };
}

test( 'stepProjectiles advances z by BOLT_SPEED·dt and counts ttl down to expiry', () => {
    const bolts: ProjectileState[] = [ { x: 0, y: 0, z: 0, ownerId: 'a', ttl: 2 * DT, dir: 1 } ];
    stepProjectiles( bolts, DT );
    assert.ok( Math.abs( bolts[ 0 ].z - BOLT_SPEED * DT ) < 1e-4, 'z did not advance by BOLT_SPEED·dt' );
    assert.ok( bolts[ 0 ].ttl > 0, 'ttl expired too early' );
    stepProjectiles( bolts, DT );
    assert.ok( bolts[ 0 ].ttl <= 0, 'ttl did not reach expiry (caller prunes at <= 0)' );
} );

test( 'stepProjectiles reads boltSpeed from SimConfig — doubling it doubles per-tick travel', () => {
    const base: ProjectileState[] = [ { x: 0, y: 0, z: 0, ownerId: 'a', ttl: 1, dir: 1 } ];
    const fast: ProjectileState[] = [ { x: 0, y: 0, z: 0, ownerId: 'a', ttl: 1, dir: 1 } ];
    stepProjectiles( base, DT, DEFAULT_SIM_CONFIG );
    stepProjectiles( fast, DT, { ...DEFAULT_SIM_CONFIG, boltSpeed: DEFAULT_SIM_CONFIG.boltSpeed * 2 } );
    assert.ok( base[ 0 ].z > 0, 'baseline bolt did not advance' );
    assert.ok(
        Math.abs( fast[ 0 ].z - 2 * base[ 0 ].z ) < 1e-9,
        'doubled boltSpeed did not double travel → param not wired',
    );
} );

test( 'boltHits: a bolt inside the footprint band hits a non-owner victim', () => {
    const bolt: ProjectileState = { x: 0, y: 0, z: 0, ownerId: 'shooter', ttl: 1, dir: 1 };
    assert.deepEqual( boltHits( bolt, [ victim() ] ), [ 'v' ] );
} );

test( 'boltHits is owner-immune — a bolt never hits its own shooter', () => {
    const bolt: ProjectileState = { x: 0, y: 0, z: 0, ownerId: 'v', ttl: 1, dir: 1 };
    assert.deepEqual( boltHits( bolt, [ victim() ] ), [] );
} );

test( 'boltHits: lateral miss — bolt just past the wing + its own half clears the ship', () => {
    const bolt: ProjectileState = { x: 1.3 + BOLT_HALF + 0.01, y: 0, z: 0, ownerId: 's', ttl: 1, dir: 1 };
    assert.deepEqual( boltHits( bolt, [ victim() ] ), [] );
} );

test( 'boltHits: forward z-band — a bolt catches a ship just within halfL + its own half', () => {
    const z = 100 - 1.26 - BOLT_HALF + 0.01;
    const bolt: ProjectileState = { x: 0, y: 0, z, ownerId: 's', ttl: 1, dir: 1 };
    assert.deepEqual( boltHits( bolt, [ victim( { z: 100 } ) ] ), [ 'v' ] );
} );

test( 'boltHits: SWEPT — a bolt that steps PAST a short hull in one tick still registers (no tunneling)', () => {
    const s = victim( { z: 100, halfL: 0.9 } );
    const bolt: ProjectileState = { x: 0, y: 0, z: 110, ownerId: 's', ttl: 1, dir: 1 };
    assert.deepEqual(
        boltHits( bolt, [ s ] ),
        [],
        'point test (sweep=0) misses the tunneled bolt — the bug this guards',
    );
    assert.deepEqual( boltHits( bolt, [ s ], 20 ), [ 'v' ], 'swept test catches the bolt that crossed the ship' );
} );

test( 'boltHits: SWEPT is bounded — a sweep that stops short of the ship does NOT hit', () => {
    const s = victim( { z: 100, halfL: 0.9 } );
    const bolt: ProjectileState = { x: 0, y: 0, z: 110, ownerId: 's', ttl: 1, dir: 1 };
    assert.deepEqual( boltHits( bolt, [ s ], 5 ), [] );
} );

test( 'a bolt fired back travels -z at boltSpeed', () => {
    const bolts: ProjectileState[] = [ { x: 0, y: 0, z: 100, ownerId: 'a', ttl: 1, dir: -1 } ];
    stepProjectiles( bolts, DT );
    assert.ok( Math.abs( bolts[ 0 ].z - ( 100 - BOLT_SPEED * DT ) ) < 1e-9 );
} );

test( 'boltHits fired back: the sweep reaches +z behind the bolt and catches the ship it crossed', () => {
    const bolt: ProjectileState = { x: 0, y: 0, z: 90, ownerId: 's', ttl: 1, dir: -1 };
    const s = victim( { z: 100 } );
    assert.deepEqual( boltHits( bolt, [ s ] ), [] );
    assert.deepEqual( boltHits( bolt, [ s ], 20 ), [ 'v' ] );
    assert.deepEqual( boltHits( bolt, [ victim( { z: 80 } ) ], 20 ), [] );
} );

test( 'boltHits skips dead + spectating ships', () => {
    const bolt: ProjectileState = { x: 0, y: 0, z: 0, ownerId: 's', ttl: 1, dir: 1 };
    const ships = [ victim( { id: 'd', dead: true } ), victim( { id: 'p', spectating: true } ) ];
    assert.deepEqual( boltHits( bolt, ships ), [] );
} );
