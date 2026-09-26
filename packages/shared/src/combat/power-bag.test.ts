import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import { HeldPower } from './constants.js';
import { pickupPower } from './pickups.js';
import { bagCounts, longestRun, POWER_BAG_SIZE, POWER_RUN_CAP, powerBag } from './power-bag.js';

const SALTS = [ '', 'a', 'x9k2', '1pq0zz', 'groove' ];

test( 'the default bag deals 2 bolts, 6 seekers, 6 mines, 3 boosts and 3 shields', () => {
    assert.deepEqual( bagCounts(), [
        { power: HeldPower.bolt, count: 2 },
        { power: HeldPower.seeker, count: 6 },
        { power: HeldPower.mine, count: 6 },
        { power: HeldPower.boost, count: 3 },
        { power: HeldPower.shield, count: 3 },
    ] );
} );

test( 'boost and shield ratios take their share from the bolts', () => {
    assert.deepEqual(
        bagCounts( { ...DEFAULT_SIM_CONFIG, boostRatio: 0.15, shieldRatio: 0.15, seekerRatio: 0.2, mineRatio: 0.2 } ),
        [
            { power: HeldPower.bolt, count: 6 },
            { power: HeldPower.seeker, count: 4 },
            { power: HeldPower.mine, count: 4 },
            { power: HeldPower.boost, count: 3 },
            { power: HeldPower.shield, count: 3 },
        ],
    );
    assert.deepEqual(
        bagCounts( { ...DEFAULT_SIM_CONFIG, seekerRatio: 0.6, mineRatio: 0.3, boostRatio: 0.5, shieldRatio: 0 } ),
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
    assert.equal( pickupPower( '17.a', { ...DEFAULT_SIM_CONFIG, seekerRatio: 1 } ), HeldPower.seeker );
    assert.equal(
        pickupPower( '17.a', { ...DEFAULT_SIM_CONFIG, seekerRatio: 0, mineRatio: 0, boostRatio: 0, shieldRatio: 0 } ),
        HeldPower.bolt,
    );
} );
