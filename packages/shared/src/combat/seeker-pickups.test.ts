import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    armourForShip,
    DEFAULT_SIM_CONFIG,
    FIXED_DT,
    type Gunner,
    HeldPower,
    pickupPower,
    type SimConfig,
    seekerGate,
    stepPickups,
    stunDurationForShip,
} from '../index.js';

test( 'pickup power is stable and near seekerRatio', () => {
    const ids = Array.from( { length: 400 }, ( _, i ) => String( i ) );
    const seekers = ids.filter( ( id ) => pickupPower( id ) === HeldPower.seeker ).length;
    assert.ok( Math.abs( seekers / ids.length - DEFAULT_SIM_CONFIG.seekerRatio ) < 0.07, `ratio ${ seekers / 400 }` );
    assert.equal( pickupPower( '17' ), pickupPower( '17' ) );
    assert.equal( pickupPower( '17', { ...DEFAULT_SIM_CONFIG, seekerRatio: 0 } ), HeldPower.bolt );
    assert.equal( pickupPower( '17', { ...DEFAULT_SIM_CONFIG, seekerRatio: 1 } ), HeldPower.seeker );
} );

function empty( z: number ): Gunner {
    return { x: 0, y: 0, z, heldPower: HeldPower.none, stunTimer: 0, dead: false, spectating: false };
}

const ALL_SEEKERS: SimConfig = { ...DEFAULT_SIM_CONFIG, seekerRatio: 1 };

function grab( racers: [ string, Gunner ][], owners: string[], cfg: SimConfig ): void {
    const pickups = racers.map( ( [ id, r ] ) => ( { id: `p${ id }`, x: 0, y: 0, z: r.z } ) );
    const gate = seekerGate( racers, owners, cfg );
    stepPickups(
        racers.map( ( [ , r ] ) => r ),
        pickups,
        new Map(),
        new Map(),
        FIXED_DT,
        cfg,
        gate,
    );
}

test( 'room scope: only one seeker in the room; the rest get bolts', () => {
    const a = empty( 0 );
    const b = empty( 100 );
    grab(
        [
            [ 'a', a ],
            [ 'b', b ],
        ],
        [],
        ALL_SEEKERS,
    );
    assert.deepEqual( [ a.heldPower, b.heldPower ], [ HeldPower.seeker, HeldPower.bolt ] );

    const c = empty( 0 );
    grab( [ [ 'c', c ] ], [ 'someone' ], ALL_SEEKERS );
    assert.equal( c.heldPower, HeldPower.bolt, 'a live seeker should block the grant' );
} );

test( 'room scope: a held seeker also blocks the grant', () => {
    const holder = { ...empty( 500 ), heldPower: HeldPower.seeker };
    const c = empty( 0 );
    const gate = seekerGate(
        [
            [ 'h', holder ],
            [ 'c', c ],
        ],
        [],
        ALL_SEEKERS,
    );
    stepPickups( [ c ], [ { id: 'p', x: 0, y: 0, z: 0 } ], new Map(), new Map(), FIXED_DT, ALL_SEEKERS, gate );
    assert.equal( c.heldPower, HeldPower.bolt );
} );

test( 'shooter scope: each racer may have one seeker', () => {
    const cfg: SimConfig = { ...ALL_SEEKERS, seekerScope: 'shooter' };
    const a = empty( 0 );
    const b = empty( 100 );
    grab(
        [
            [ 'a', a ],
            [ 'b', b ],
        ],
        [ 'a' ],
        cfg,
    );
    assert.deepEqual( [ a.heldPower, b.heldPower ], [ HeldPower.bolt, HeldPower.seeker ] );
} );

test( 'the seeker stun is longer than the bolt stun and still armour-scaled', () => {
    const cfg = DEFAULT_SIM_CONFIG;
    assert.ok( cfg.seekerStunS > cfg.stunSeconds );
    const id = 'fighter';
    assert.equal( stunDurationForShip( id, cfg, cfg.seekerStunS ), cfg.seekerStunS * ( 1 - armourForShip( id ) ) );
    assert.ok( stunDurationForShip( id, cfg, cfg.seekerStunS ) > stunDurationForShip( id, cfg ) );
} );
