import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import { defineRules } from './define-rules.js';
import { indexRules, parseRuleOverrides, RULE_SPECS, resolveRules } from './resolve-rules.js';

test( 'the table holds the ten v1 rules', () => {
    assert.deepEqual( [ ...RULE_SPECS.keys() ].sort(), [
        'pickup.grabR',
        'seeker.flyY',
        'tug.blockMax',
        'tug.blockMin',
        'tug.latchSlack',
        'tug.pullS',
        'tug.range',
        'tug.throwMaxS',
        'tug.throwMinS',
        'tug.towS',
    ] );
} );

test( 'every rule default lies inside its range', () => {
    for ( const spec of RULE_SPECS.values() ) {
        const value = DEFAULT_SIM_CONFIG[ spec.key ];
        assert.ok( value >= spec.min && value <= spec.max, `${ spec.id } = ${ value }` );
    }
} );

test( 'a duplicate rule id throws', () => {
    const twice = [ ...defineRules( 'tug', { range: { key: 'tugRange', min: 0, max: 1, step: 1 } } ) ];
    assert.throws( () => indexRules( [ ...twice, ...twice ] ), /duplicate id "tug.range"/ );
} );

test( 'two rules on one config key throw', () => {
    const entries = defineRules( 'tug', {
        range: { key: 'tugRange', min: 0, max: 1, step: 1 },
        reach: { key: 'tugRange', min: 0, max: 1, step: 1 },
    } );
    assert.throws( () => indexRules( entries ), /duplicate key "tugRange"/ );
} );

test( 'an empty override map resolves to the defaults', () => {
    const config = resolveRules( [] );
    assert.deepEqual( config, DEFAULT_SIM_CONFIG );
    assert.notEqual( config, DEFAULT_SIM_CONFIG );
} );

test( 'an override writes its flat config key and leaves the rest', () => {
    const config = resolveRules( [ [ 'tug.pullS', 2.5 ] ] );
    assert.equal( config.tugS, 2.5 );
    assert.deepEqual( { ...config, tugS: DEFAULT_SIM_CONFIG.tugS }, DEFAULT_SIM_CONFIG );
} );

test( 'an unknown override id is ignored by the merge', () => {
    assert.deepEqual( resolveRules( [ [ 'tug.nope', 9 ] ] ), DEFAULT_SIM_CONFIG );
} );

test( 'a valid payload parses to fround values clamped to each range', () => {
    const parsed = parseRuleOverrides( { 'tug.range': 9000, 'seeker.flyY': 0, 'pickup.grabR': 1.3 } );
    assert.deepEqual(
        parsed,
        new Map( [
            [ 'tug.range', 400 ],
            [ 'seeker.flyY', 0.5 ],
            [ 'pickup.grabR', Math.fround( 1.3 ) ],
        ] ),
    );
} );

test( 'an empty payload parses to an empty map', () => {
    assert.deepEqual( parseRuleOverrides( {} ), new Map() );
} );

test( 'a payload that is not a plain object is rejected', () => {
    for ( const payload of [ null, undefined, 3, 'x', [ 1 ], new Map( [ [ 'tug.range', 50 ] ] ) ] ) {
        assert.equal( parseRuleOverrides( payload ), null );
    }
} );

test( 'a payload with an unknown id is rejected whole', () => {
    assert.equal( parseRuleOverrides( { 'tug.range': 50, 'tug.nope': 1 } ), null );
} );

test( 'a payload with a non-finite or non-number value is rejected whole', () => {
    for ( const value of [ Number.NaN, Number.POSITIVE_INFINITY, '50', true, null ] ) {
        assert.equal( parseRuleOverrides( { 'tug.range': value } ), null );
    }
} );
