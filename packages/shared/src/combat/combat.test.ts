import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ALL_CLASS_TUNINGS, FASTEST_CRUISE } from '../ship-classes.js';
import { pickupColumnClear } from '../sim/pickup-place.js';
import { HALF_WIDTH, START_SAFE, segIndexForZ, type Track } from '../sim/space.js';
import { procgenDescriptor, resolveTrack } from '../sim/track-provider.js';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import { grabPickup, type Pickup, pickupLayout } from './pickups.js';

const DT = 1 / 60;

const makeTrack = ( seed: number ): Track => resolveTrack( procgenDescriptor( seed, 'weave' ) );
const layout = ( seed: number ): Pickup[] => pickupLayout( procgenDescriptor( seed, 'weave' ) );

test( 'grabPickup: the hull overlapping the grab box grants; just outside (x or z) does not', () => {
    const p: Pickup = { id: '8', x: 5, y: 0, z: 200 };
    const hull = { halfW: 1.1, halfL: 0.59 };
    const reachX = DEFAULT_SIM_CONFIG.pickupGrabR + hull.halfW;
    const reachZ = DEFAULT_SIM_CONFIG.pickupGrabR + hull.halfL;
    assert.equal( grabPickup( { ...hull, x: 5 + reachX - 0.1, z: 200 }, p ), true );
    assert.equal( grabPickup( { ...hull, x: 5 - reachX + 0.1, z: 200 }, p ), true );
    assert.equal( grabPickup( { ...hull, x: 5 + reachX + 0.1, z: 200 }, p ), false );
    assert.equal( grabPickup( { ...hull, x: 5, z: 200 + reachZ - 0.1 }, p ), true );
    assert.equal( grabPickup( { ...hull, x: 5, z: 200 + reachZ + 0.1 }, p ), false );
} );

test( 'grabPickup reads pickupGrabR from the config it is given', () => {
    const p: Pickup = { id: '8', x: 0, y: 0, z: 0 };
    const ship = { x: 6, z: 0, halfW: 1, halfL: 1 };
    assert.equal( grabPickup( ship, p ), false );
    assert.equal( grabPickup( ship, p, { ...DEFAULT_SIM_CONFIG, pickupGrabR: 5.5 } ), true );
} );

test( 'the grab box is deeper than the fastest ship moves in one tick, so no pickup is skipped', () => {
    const shortest = Math.min( ...ALL_CLASS_TUNINGS.map( ( t ) => t.halfL ) );
    const depth = 2 * ( DEFAULT_SIM_CONFIG.pickupGrabR + shortest );
    const cfg = DEFAULT_SIM_CONFIG;
    const ceiling = FASTEST_CRUISE * ( 1 + cfg.boostGain + cfg.tugGain ) + cfg.tugKick + cfg.towKick;
    assert.ok( ceiling * DT < depth, `${ ceiling * DT } u/tick vs box depth ${ depth }` );
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
        slots.every( ( p ) => segIndexForZ( p.z ) >= START_SAFE ),
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
            const seg = track.segmentAt( segIndexForZ( p.z ) );
            assert.ok( seg.floors.length > 0, `seed ${ seed }: pickup ${ p.id } placed over a hole (gap)` );
            const buried = seg.blocks.some( ( b ) => p.x >= b.x0 && p.x < b.x1 && p.z >= b.z0 && p.z < b.z1 );
            assert.ok( ! buried, `seed ${ seed }: pickup ${ p.id } buried inside a lethal wall block` );
            assert.ok(
                pickupColumnClear( p.x, p.z, ( i ) => track.segmentAt( i ) ),
                `seed ${ seed }: pickup ${ p.id } has no clear approach column`,
            );
        }
    }
} );
