import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HeldPower } from '../combat/constants.js';
import { SIM_FEATURES } from './registry.js';
import { FEATURE_POWERS, sortFeatures } from './sim-hooks.js';

test( 'the registry loads first without a TDZ cycle and lists bolt, mine, seeker, tug, boost, shield and portal', () => {
    assert.deepEqual(
        SIM_FEATURES.map( ( f ) => f.id ),
        [ 'bolt', 'mine', 'seeker', 'tug', 'boost', 'shield', 'portal' ],
    );
} );

test( 'every held power except none has a run.use', () => {
    const used = SIM_FEATURES.flatMap( ( f ) =>
        f.power && f.openRun?.().use ? [ f.power.kind, ...( f.power.uses ?? [] ) ] : [],
    );
    const kinds = Object.values( HeldPower ).filter( ( k ) => k !== HeldPower.none );
    assert.deepEqual( [ ...used ].sort(), [ ...kinds ].sort() );
} );

test( 'a shuffled registry sorts into the same order', () => {
    const ids = [ ...SIM_FEATURES.map( ( f ) => f.id ), 'aim', 'zap', 'mid' ].map( ( id ) => ( { id } ) );
    const forward = sortFeatures( ids ).map( ( f ) => f.id );
    const reversed = sortFeatures( [ ...ids ].reverse() ).map( ( f ) => f.id );
    assert.deepEqual( reversed, forward );
    assert.deepEqual( forward, [ 'aim', 'bolt', 'boost', 'mid', 'mine', 'portal', 'seeker', 'shield', 'tug', 'zap' ] );
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
