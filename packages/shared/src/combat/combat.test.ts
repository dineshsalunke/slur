// S5 combat foundations — pure/headless contract tests (the same desync-guard discipline as step.test:
// server and client run these exact functions, so any divergence here would desync live play).

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HALF_WIDTH, START_SAFE, type Track } from '../sim/track.js';
import { procgenDescriptor, resolveTrack } from '../sim/track-provider.js';
import { BOLT_HALF, BOLT_SPEED } from './constants.js';
import { grabPickup, PICKUP_GRAB_RADIUS, type Pickup, pickupLayout } from './pickups.js';
import { boltHits, type HitShip, type ProjectileState, stepProjectiles } from './projectiles.js';

const DT = 1 / 60;

// ADR-001: the track + pickup layout now flow from a TrackDescriptor. Thin seed→ wrappers keep the
// seed-driven assertions below readable while proving the same geometry/layout flows through the new seam.
const makeTrack = ( seed: number ): Track => resolveTrack( procgenDescriptor( seed ) );
const layout = ( seed: number ): Pickup[] => pickupLayout( procgenDescriptor( seed ) );

// A default-live victim at the origin (Fighter footprint), override per case.
function victim( over: Partial< HitShip > = {} ): HitShip {
    return { id: 'v', x: 0, y: 0, z: 0, halfW: 1.3, halfL: 1.26, dead: false, spectating: false, ...over };
}

test( 'stepProjectiles advances z by BOLT_SPEED·dt and counts ttl down to expiry', () => {
    const bolts: ProjectileState[] = [ { x: 0, y: 0, z: 0, ownerId: 'a', ttl: 2 * DT } ];
    stepProjectiles( bolts, DT );
    assert.ok( Math.abs( bolts[ 0 ].z - BOLT_SPEED * DT ) < 1e-4, 'z did not advance by BOLT_SPEED·dt' );
    assert.ok( bolts[ 0 ].ttl > 0, 'ttl expired too early' );
    stepProjectiles( bolts, DT );
    assert.ok( bolts[ 0 ].ttl <= 0, 'ttl did not reach expiry (caller prunes at <= 0)' );
} );

test( 'boltHits: a bolt inside the footprint band hits a non-owner victim', () => {
    const bolt: ProjectileState = { x: 0, y: 0, z: 0, ownerId: 'shooter', ttl: 1 };
    assert.deepEqual( boltHits( bolt, [ victim() ] ), [ 'v' ] );
} );

test( 'boltHits is owner-immune — a bolt never hits its own shooter', () => {
    const bolt: ProjectileState = { x: 0, y: 0, z: 0, ownerId: 'v', ttl: 1 };
    assert.deepEqual( boltHits( bolt, [ victim() ] ), [] );
} );

test( 'boltHits: lateral miss — bolt just past the wing + its own half clears the ship', () => {
    const bolt: ProjectileState = { x: 1.3 + BOLT_HALF + 0.01, y: 0, z: 0, ownerId: 's', ttl: 1 };
    assert.deepEqual( boltHits( bolt, [ victim() ] ), [] );
} );

test( 'boltHits: forward z-band — a bolt catches a ship just within halfL + its own half', () => {
    const z = 100 - 1.26 - BOLT_HALF + 0.01; // bolt.z + BOLT_HALF just crosses ship.z - halfL
    const bolt: ProjectileState = { x: 0, y: 0, z, ownerId: 's', ttl: 1 };
    assert.deepEqual( boltHits( bolt, [ victim( { z: 100 } ) ] ), [ 'v' ] );
} );

test( 'boltHits: SWEPT — a bolt that steps PAST a short hull in one tick still registers (no tunneling)', () => {
    // Ship at z=100 (short ~Comet hull). The bolt's POST-step position is z=110 — beyond the ship's z-band —
    // so a point test (sweep=0) misses it: that IS the tunneling bug. Having swept 20u (from z=90), it crossed
    // the ship, so the swept test must catch it. Explicit sweep keeps this decoupled from BOLT_SPEED retuning.
    const s = victim( { z: 100, halfL: 0.9 } );
    const bolt: ProjectileState = { x: 0, y: 0, z: 110, ownerId: 's', ttl: 1 };
    assert.deepEqual(
        boltHits( bolt, [ s ] ),
        [],
        'point test (sweep=0) misses the tunneled bolt — the bug this guards',
    );
    assert.deepEqual( boltHits( bolt, [ s ], 20 ), [ 'v' ], 'swept test catches the bolt that crossed the ship' );
} );

test( 'boltHits: SWEPT is bounded — a sweep that stops short of the ship does NOT hit', () => {
    // Same post-step z=110, but only 5u of travel (from z=105): the segment never reached the ship at z=100,
    // so it must miss. Guards against an unbounded back-edge that would false-positive on any ship behind.
    const s = victim( { z: 100, halfL: 0.9 } );
    const bolt: ProjectileState = { x: 0, y: 0, z: 110, ownerId: 's', ttl: 1 };
    assert.deepEqual( boltHits( bolt, [ s ], 5 ), [] );
} );

test( 'boltHits skips dead + spectating ships', () => {
    const bolt: ProjectileState = { x: 0, y: 0, z: 0, ownerId: 's', ttl: 1 };
    const ships = [ victim( { id: 'd', dead: true } ), victim( { id: 'p', spectating: true } ) ];
    assert.deepEqual( boltHits( bolt, ships ), [] );
} );

test( 'grabPickup: overlap within the grab radius grants; just outside (x or z) does not', () => {
    const p: Pickup = { id: '8', x: 5, y: 0, z: 200 };
    assert.equal( grabPickup( { x: 5 + PICKUP_GRAB_RADIUS - 0.1, z: 200 }, p ), true );
    assert.equal( grabPickup( { x: 5 + PICKUP_GRAB_RADIUS + 0.1, z: 200 }, p ), false );
    assert.equal( grabPickup( { x: 5, z: 200 + PICKUP_GRAB_RADIUS + 0.1 }, p ), false );
} );

test( 'pickupLayout is deterministic — two calls with the same descriptor are byte-identical', () => {
    assert.deepEqual( layout( 12345 ), layout( 12345 ) );
} );

test( 'pickupLayout: a different seed yields a different layout (positions AND which segments qualify)', () => {
    // Hazard-awareness makes the slot SET seed-dependent (different segments are plain per seed), so the two
    // layouts differ in count and/or lateral position — just assert they are not identical.
    assert.notDeepEqual( layout( 1 ), layout( 2 ) );
} );

test( 'pickupLayout: slots sit after the start-safe zone and inside the corridor', () => {
    const slots = layout( 777 );
    assert.ok( slots.length > 0, 'no pickups generated' );
    assert.ok(
        slots.every( ( p ) => Number( p.id ) >= START_SAFE ),
        'a pickup landed inside the start-safe zone',
    );
    assert.ok(
        slots.every( ( p ) => Math.abs( p.x ) <= HALF_WIDTH ),
        'a pickup fell outside the rails',
    );
} );

test( 'pickupLayout: every slot sits on floor and inside the open corridor — never over a hole or buried in a wall', () => {
    for ( const seed of [ 1, 2, 777, 12345, 999983 ] ) {
        const track = makeTrack( seed );
        for ( const p of layout( seed ) ) {
            const seg = track.segmentAt( Number( p.id ) );
            assert.ok( seg.floors.length > 0, `seed ${ seed }: pickup ${ p.id } placed over a hole (gap)` );
            // Only LETHAL walls "bury" a pickup — a drag (amber) block is passable, so a pickup on one is
            // still grabbable (you pass through it, slowing). The corridor is lethal-free, so this always holds.
            const buried = seg.blocks.some(
                ( b ) => b.lethal && p.x >= b.x0 && p.x < b.x1 && p.z >= b.z0 && p.z < b.z1,
            );
            assert.ok( ! buried, `seed ${ seed }: pickup ${ p.id } buried inside a lethal wall block` );
        }
    }
} );
