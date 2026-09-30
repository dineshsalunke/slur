import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SIM_FEATURES } from './registry.js';
import { FEATURE_POWERS, sortFeatures } from './sim-hooks.js';

test( 'the registry loads first without a TDZ cycle and lists bolt and tug', () => {
    assert.deepEqual(
        SIM_FEATURES.map( ( f ) => f.id ),
        [ 'bolt', 'tug' ],
    );
} );

test( 'a shuffled registry sorts into the same order', () => {
    const ids = [ ...SIM_FEATURES.map( ( f ) => f.id ), 'aim', 'zap', 'mid' ].map( ( id ) => ( { id } ) );
    const forward = sortFeatures( ids ).map( ( f ) => f.id );
    const reversed = sortFeatures( [ ...ids ].reverse() ).map( ( f ) => f.id );
    assert.deepEqual( reversed, forward );
    assert.deepEqual( forward, [ 'aim', 'bolt', 'mid', 'tug', 'zap' ] );
} );

test( 'a duplicate feature id throws', () => {
    assert.throws( () => sortFeatures( [ { id: 'tug' }, { id: 'tug' } ] ), /duplicate id "tug"/ );
} );

test( 'every feature power has a distinct kind', () => {
    const kinds = FEATURE_POWERS.map( ( p ) => p.kind );
    assert.equal( new Set( kinds ).size, kinds.length );
} );

test( 'exactly one feature power takes the rest of the bag', () => {
    assert.equal( FEATURE_POWERS.filter( ( p ) => 'bagRest' in p ).length, 1 );
} );
