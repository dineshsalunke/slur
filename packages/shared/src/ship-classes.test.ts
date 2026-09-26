import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STUN_SECONDS } from './combat/constants.js';
import {
    armourForShip,
    DEFAULT_SHIP,
    isShipId,
    SHIP_CLASSES,
    SHIP_ORDER,
    shipOf,
    stunDurationForShip,
    tuningForShip,
} from './ship-classes.js';
import { DEFAULT_SIM_CONFIG } from './sim-config.js';

test( 'prototype keys are not ship ids and fall back to the default ship', () => {
    for ( const key of [ 'constructor', 'toString', '__proto__', 'hasOwnProperty' ] ) {
        assert.equal( isShipId( key ), false, key );
        assert.equal( shipOf( key ).id, DEFAULT_SHIP, key );
        assert.doesNotThrow( () => tuningForShip( key ), key );
    }
    for ( const id of SHIP_ORDER ) assert.equal( isShipId( id ), true, id );
} );

test( 'every class declares armour inside the 0..1 band', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        assert.ok( c.armour >= 0, `${ c.id } armour is below 0` );
        assert.ok( c.armour <= 1, `${ c.id } armour is above 1` );
    }
} );

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

test( 'each ship takes its published stun duration', () => {
    const published: Record< string, number > = {
        executioner: 1.2,
        bob: 1.08,
        challenger: 0.96,
        dispatcher: 0.84,
        'split-crown': 0.72,
    };
    for ( const shipId of SHIP_ORDER ) {
        const want = published[ shipId ];
        assert.ok( want !== undefined, `${ shipId } has no published stun duration — add it to this table` );
        assert.ok(
            Math.abs( stunDurationForShip( shipId ) - want ) < 1e-9,
            `${ shipId } stun is ${ stunDurationForShip( shipId ) }s, published ${ want }s`,
        );
    }
} );

test( 'the armour spread is wide enough to change how a hit feels', () => {
    const longest = stunDurationForShip( 'executioner' );
    const shortest = stunDurationForShip( 'split-crown' );
    assert.ok(
        longest - shortest >= 0.3,
        `armour spread is only ${ ( longest - shortest ).toFixed( 3 ) }s — too small to read in play`,
    );
} );

test( 'the best weaver takes a strictly longer stun than the worst', () => {
    assert.ok(
        stunDurationForShip( 'executioner' ) > stunDurationForShip( 'split-crown' ),
        'the Interceptor variant must stay stunned longer than the Freighter variant',
    );
    assert.equal( stunDurationForShip( 'executioner' ), STUN_SECONDS, 'a zero-armour ship takes the full stun' );
} );

test( 'stunDurationForShip reads stunSeconds from SimConfig — doubling it doubles the stun', () => {
    const base = stunDurationForShip( 'executioner', DEFAULT_SIM_CONFIG );
    const doubled = stunDurationForShip( 'executioner', {
        ...DEFAULT_SIM_CONFIG,
        stunSeconds: DEFAULT_SIM_CONFIG.stunSeconds * 2,
    } );
    assert.ok( base > 0, 'baseline stun is zero — cannot detect scaling' );
    assert.ok( Math.abs( doubled - 2 * base ) < 1e-9, 'doubled stunSeconds did not double the stun → param not wired' );
} );

test( 'an unknown ship id falls back to the default ship armour', () => {
    const fallback = armourForShip( DEFAULT_SHIP );
    assert.equal( armourForShip( '' ), fallback, 'an empty id falls back' );
    assert.equal( armourForShip( 'not-a-ship' ), fallback, 'an unknown id falls back' );
    assert.equal( stunDurationForShip( 'not-a-ship' ), stunDurationForShip( DEFAULT_SHIP ), 'so does the duration' );
} );
