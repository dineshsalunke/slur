// Ship combat identity — armour and the stun duration it scales. Server-authoritative data, so these are
// contract tests: the server reads them to write stunTimer and the pick-UI reads them to describe a ship.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STUN_SECONDS } from './combat/constants.js';
import {
    armourForShip,
    classOfShip,
    DEFAULT_SHIP,
    SHIP_CLASSES,
    SHIP_ORDER,
    stunDurationForShip,
} from './ship-classes.js';

test( 'every class declares armour inside the 0..1 band', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        assert.ok( c.armour >= 0, `${ c.id } armour is below 0` );
        assert.ok( c.armour <= 1, `${ c.id } armour is above 1` );
    }
} );

// The load-bearing balance rule. Armour is a SIDEGRADE, not a free stat: a bolt is dodged by weaving, so
// the ship that weaves best must take the longest stun. If someone later raises a nimble class's armour
// without lowering its strafe, this test is the thing that catches it.
test( 'armour ranks as the exact inverse of strafe authority', () => {
    const byWeave = Object.values( SHIP_CLASSES )
        .slice()
        .sort( ( a, b ) => b.tuning.strafeAccel - a.tuning.strafeAccel );

    for ( let i = 1; i < byWeave.length; i++ ) {
        const better = byWeave[ i - 1 ];
        const worse = byWeave[ i ];
        assert.ok( better, 'ordering holds' );
        assert.ok( worse, 'ordering holds' );
        assert.ok(
            better.armour < worse.armour,
            `${ better.id } weaves better than ${ worse.id }, so it must carry LESS armour ` +
                `(${ better.armour } vs ${ worse.armour })`,
        );
    }
} );

test( 'stun duration is STUN_SECONDS scaled by the ship class armour', () => {
    for ( const shipId of SHIP_ORDER ) {
        const expected = STUN_SECONDS * ( 1 - classOfShip( shipId ).armour );
        assert.ok(
            Math.abs( stunDurationForShip( shipId ) - expected ) < 1e-9,
            `${ shipId } stun duration does not match its armour`,
        );
    }
} );

// A bolt must stun the nimble ship for longer than the sluggish one — the whole point of the stat, asserted
// on the end value rather than on the multiplier.
test( 'the best weaver takes a strictly longer stun than the worst', () => {
    assert.ok(
        stunDurationForShip( 'executioner' ) > stunDurationForShip( 'imperial' ),
        'the Interceptor variant must stay stunned longer than the Freighter variant',
    );
    assert.equal( stunDurationForShip( 'executioner' ), STUN_SECONDS, 'a zero-armour ship takes the full stun' );
} );

// Same fallback discipline as tuningForShip: a stale or empty wire value can never crash the sim.
test( 'an unknown ship id falls back to the default ship armour', () => {
    const fallback = armourForShip( DEFAULT_SHIP );
    assert.equal( armourForShip( '' ), fallback, 'an empty id falls back' );
    assert.equal( armourForShip( 'not-a-ship' ), fallback, 'an unknown id falls back' );
    assert.equal( stunDurationForShip( 'not-a-ship' ), stunDurationForShip( DEFAULT_SHIP ), 'so does the duration' );
} );
