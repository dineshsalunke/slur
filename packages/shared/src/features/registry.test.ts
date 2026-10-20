import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HeldPower, HIT_MESSAGE } from '../combat/constants.js';
import { BOUNCE_MESSAGE } from '../sim/bounce-contact.js';
import { SIM_FEATURES } from './registry.js';
import { claimEvents, FEATURE_POWERS, RUN_EVENT_OWNERS, sortFeatures } from './sim-hooks.js';
import { TUG_MESSAGE } from './tug/tug-constants.js';

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

test( 'each run event has one owner, and core keeps hit and bounce', () => {
    assert.equal( RUN_EVENT_OWNERS.get( HIT_MESSAGE ), 'core' );
    assert.equal( RUN_EVENT_OWNERS.get( BOUNCE_MESSAGE ), 'core' );
    assert.equal( RUN_EVENT_OWNERS.get( TUG_MESSAGE ), 'tug' );
    assert.equal( RUN_EVENT_OWNERS.size, 9 );
} );

test( 'a feature that claims a taken event throws', () => {
    const tug = { id: 'tug', messages: [ TUG_MESSAGE ] };
    assert.throws(
        () => claimEvents( [ tug, { id: 'zap', messages: [ TUG_MESSAGE ] } ], [] ),
        /"zap" claims event "tug" of "tug"/,
    );
    assert.throws( () => claimEvents( [ { id: 'zap', messages: [ HIT_MESSAGE ] } ], [ HIT_MESSAGE ] ), /of "core"/ );
} );
