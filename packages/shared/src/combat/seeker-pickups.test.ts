import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    armourForShip,
    DEFAULT_SHIP,
    DEFAULT_SIM_CONFIG,
    emptySlots,
    FIXED_DT,
    type Grabber,
    HeldPower,
    pickupPower,
    type SimConfig,
    stepPickups,
    stunDurationForShip,
} from '../index.js';

test( 'pickup power is stable and near seekerRatio', () => {
    const ids = Array.from( { length: 400 }, ( _, i ) => String( i ) );
    const seekers = ids.filter( ( id ) => pickupPower( id ) === HeldPower.seeker ).length;
    assert.ok( Math.abs( seekers / ids.length - DEFAULT_SIM_CONFIG.seekerRatio ) < 0.07, `ratio ${ seekers / 400 }` );
    assert.equal( pickupPower( '17' ), pickupPower( '17' ) );
    assert.equal(
        pickupPower( '17', {
            ...DEFAULT_SIM_CONFIG,
            seekerRatio: 0,
            mineRatio: 0,
            boostRatio: 0,
            shieldRatio: 0,
            portalRatio: 0,
            tugRatio: 0,
        } ),
        HeldPower.bolt,
    );
    assert.equal( pickupPower( '17', { ...DEFAULT_SIM_CONFIG, seekerRatio: 1 } ), HeldPower.seeker );
} );

function empty( z: number ): Grabber {
    return { x: 0, y: 0, z, slots: emptySlots(), stunTimer: 0, dead: false, spectating: false, shipId: DEFAULT_SHIP };
}

const ALL_SEEKERS: SimConfig = { ...DEFAULT_SIM_CONFIG, seekerRatio: 1 };

test( 'a seeker canister always grants a seeker, to every racer and into every slot', () => {
    const a = empty( 0 );
    const b = empty( 100 );
    for ( let i = 0; i < 3; i++ ) {
        const pickups = [
            { id: `a${ i }`, x: 0, y: 0, z: 0 },
            { id: `b${ i }`, x: 0, y: 0, z: 100 },
        ];
        stepPickups( [ a, b ], pickups, new Map(), new Map(), FIXED_DT, ALL_SEEKERS );
    }
    const three = [ HeldPower.seeker, HeldPower.seeker, HeldPower.seeker ];
    assert.deepEqual( [ a.slots, b.slots ], [ three, three ] );
} );

test( 'the seeker stun is longer than the bolt stun and still armour-scaled', () => {
    const cfg = DEFAULT_SIM_CONFIG;
    assert.ok( cfg.seekerStunS > cfg.stunSeconds );
    const id = 'fighter';
    assert.equal( stunDurationForShip( id, cfg, cfg.seekerStunS ), cfg.seekerStunS * ( 1 - armourForShip( id ) ) );
    assert.ok( stunDurationForShip( id, cfg, cfg.seekerStunS ) > stunDurationForShip( id, cfg ) );
} );
