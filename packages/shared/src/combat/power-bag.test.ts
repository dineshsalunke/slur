import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import { HeldPower } from './constants.js';
import { pickupPower } from './pickups.js';
import { bagCounts, longestRun, POWER_BAG_SIZE, POWER_RUN_CAP, powerBag } from './power-bag.js';

const SALTS = [ '', 'a', 'x9k2', '1pq0zz', 'groove' ];

test( 'the default bag deals 7 bolts, 3 seekers, 4 mines, 3 boosts and 3 shields, and no portals or tugs yet', () => {
    assert.deepEqual( bagCounts(), [
        { power: HeldPower.bolt, count: 7 },
        { power: HeldPower.seeker, count: 3 },
        { power: HeldPower.mine, count: 4 },
        { power: HeldPower.boost, count: 3 },
        { power: HeldPower.shield, count: 3 },
    ] );
} );

test( 'a 0.1 portal ratio deals 2 portals out of the bolts', () => {
    assert.deepEqual( bagCounts( { ...DEFAULT_SIM_CONFIG, portalRatio: 0.1 } ), [
        { power: HeldPower.bolt, count: 5 },
        { power: HeldPower.seeker, count: 3 },
        { power: HeldPower.mine, count: 4 },
        { power: HeldPower.boost, count: 3 },
        { power: HeldPower.shield, count: 3 },
        { power: HeldPower.portal, count: 2 },
    ] );
} );

test( 'a 0.1 tug ratio deals 2 tugs out of the bolts, after the portals', () => {
    assert.deepEqual( bagCounts( { ...DEFAULT_SIM_CONFIG, portalRatio: 0.1, tugRatio: 0.1 } ), [
        { power: HeldPower.bolt, count: 3 },
        { power: HeldPower.seeker, count: 3 },
        { power: HeldPower.mine, count: 4 },
        { power: HeldPower.boost, count: 3 },
        { power: HeldPower.shield, count: 3 },
        { power: HeldPower.portal, count: 2 },
        { power: HeldPower.tug, count: 2 },
    ] );
} );

test( 'boost and shield ratios take their share from the bolts', () => {
    assert.deepEqual(
        bagCounts( {
            ...DEFAULT_SIM_CONFIG,
            boostRatio: 0.15,
            shieldRatio: 0.15,
            seekerRatio: 0.3,
            mineRatio: 0.3,
            portalRatio: 0,
            tugRatio: 0,
        } ),
        [
            { power: HeldPower.bolt, count: 2 },
            { power: HeldPower.seeker, count: 6 },
            { power: HeldPower.mine, count: 6 },
            { power: HeldPower.boost, count: 3 },
            { power: HeldPower.shield, count: 3 },
        ],
    );
    assert.deepEqual(
        bagCounts( {
            ...DEFAULT_SIM_CONFIG,
            seekerRatio: 0.6,
            mineRatio: 0.3,
            boostRatio: 0.5,
            shieldRatio: 0,
            portalRatio: 0,
            tugRatio: 0,
        } ),
        [
            { power: HeldPower.seeker, count: 12 },
            { power: HeldPower.mine, count: 6 },
            { power: HeldPower.boost, count: 2 },
        ],
    );
} );

test( 'every bag holds its counts and no power runs past the cap, across bag seams too', () => {
    const want = bagCounts();
    for ( const salt of SALTS ) {
        const seq: HeldPower[] = [];
        for ( let b = 0; b < 50; b++ ) {
            const bag = powerBag( salt, b );
            assert.equal( bag.length, POWER_BAG_SIZE );
            for ( const { power, count } of want ) {
                assert.equal( bag.filter( ( p ) => p === power ).length, count, `salt ${ salt } bag ${ b }` );
            }
            seq.push( ...bag );
        }
        assert.ok( longestRun( seq ) <= POWER_RUN_CAP, `salt ${ salt }: run ${ longestRun( seq ) }` );
    }
} );

test( 'a bag is a pure function of salt and index; salts deal different orders', () => {
    assert.deepEqual( [ ...powerBag( 'a', 3 ) ], [ ...powerBag( 'a', 3 ) ] );
    const orders = new Set( SALTS.map( ( s ) => powerBag( s, 0 ).join( '' ) ) );
    assert.equal( orders.size, SALTS.length );
} );

test( 'pickupPower reads the bag by ordinal and honours ratio overrides', () => {
    const bag = powerBag( 'a', 1 );
    for ( let i = 0; i < POWER_BAG_SIZE; i++ ) assert.equal( pickupPower( `${ POWER_BAG_SIZE + i }.a` ), bag[ i ] );
    assert.equal(
        pickupPower( '17.a', { ...DEFAULT_SIM_CONFIG, seekerRatio: 1, portalRatio: 0, tugRatio: 0 } ),
        HeldPower.seeker,
    );
    assert.equal(
        pickupPower( '17.a', {
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
} );
