import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HALF_WIDTH, START_SAFE, type Track } from '../sim/track.js';
import { procgenDescriptor, resolveTrack } from '../sim/track-provider.js';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import { BOLT_HALF, BOLT_SPEED } from './constants.js';
import { grabPickup, PICKUP_GRAB_RADIUS, type Pickup, pickupLayout } from './pickups.js';
import { boltHits, type HitShip, type ProjectileState, stepProjectiles } from './projectiles.js';

const DT = 1 / 60;

const makeTrack = ( seed: number ): Track => resolveTrack( procgenDescriptor( seed ) );
const layout = ( seed: number ): Pickup[] => pickupLayout( procgenDescriptor( seed ) );

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

test( 'stepProjectiles reads boltSpeed from SimConfig — doubling it doubles per-tick travel', () => {
    const base: ProjectileState[] = [ { x: 0, y: 0, z: 0, ownerId: 'a', ttl: 1 } ];
    const fast: ProjectileState[] = [ { x: 0, y: 0, z: 0, ownerId: 'a', ttl: 1 } ];
    stepProjectiles( base, DT, DEFAULT_SIM_CONFIG );
    stepProjectiles( fast, DT, { ...DEFAULT_SIM_CONFIG, boltSpeed: DEFAULT_SIM_CONFIG.boltSpeed * 2 } );
    assert.ok( base[ 0 ].z > 0, 'baseline bolt did not advance' );
    assert.ok(
        Math.abs( fast[ 0 ].z - 2 * base[ 0 ].z ) < 1e-9,
        'doubled boltSpeed did not double travel → param not wired',
    );
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
    const z = 100 - 1.26 - BOLT_HALF + 0.01;
    const bolt: ProjectileState = { x: 0, y: 0, z, ownerId: 's', ttl: 1 };
    assert.deepEqual( boltHits( bolt, [ victim( { z: 100 } ) ] ), [ 'v' ] );
} );

test( 'boltHits: SWEPT — a bolt that steps PAST a short hull in one tick still registers (no tunneling)', () => {
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
            const buried = seg.blocks.some(
                ( b ) => b.lethal && p.x >= b.x0 && p.x < b.x1 && p.z >= b.z0 && p.z < b.z1,
            );
            assert.ok( ! buried, `seed ${ seed }: pickup ${ p.id } buried inside a lethal wall block` );
        }
    }
} );
