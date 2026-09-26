import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { MAX_QUEUED_INPUTS, sanitizeInputs } from './room-input.js';

const valid = { seq: 7, throttle: 0.5, brake: 0, strafe: -0.25, jump: true };

describe( 'sanitizeInputs', () => {
    test( 'passes a valid input through unchanged', () => {
        assert.deepEqual( sanitizeInputs( [ valid ] ), [ valid ] );
    } );

    test( 'clamps throttle and brake to [0,1] and strafe to [-1,1]', () => {
        const [ hot ] = sanitizeInputs( [ { seq: 1, throttle: 100, brake: -3, strafe: -50, jump: false } ] );
        assert.deepEqual( hot, { seq: 1, throttle: 1, brake: 0, strafe: -1, jump: false } );
        const [ cold ] = sanitizeInputs( [ { seq: 2, throttle: -1, brake: 9, strafe: 50, jump: false } ] );
        assert.deepEqual( cold, { seq: 2, throttle: 0, brake: 1, strafe: 1, jump: false } );
    } );

    test( 'coerces jump to a strict boolean', () => {
        for ( const jump of [ 1, 'true', 'false', {}, undefined, null ] ) {
            assert.equal( sanitizeInputs( [ { ...valid, jump } ] )[ 0 ]?.jump, false );
        }
        assert.equal( sanitizeInputs( [ { ...valid, jump: true } ] )[ 0 ]?.jump, true );
    } );

    test( 'drops inputs with non-finite axes', () => {
        for ( const bad of [ Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '1', null, undefined ] ) {
            assert.deepEqual( sanitizeInputs( [ { ...valid, throttle: bad } ] ), [] );
            assert.deepEqual( sanitizeInputs( [ { ...valid, brake: bad } ] ), [] );
            assert.deepEqual( sanitizeInputs( [ { ...valid, strafe: bad } ] ), [] );
        }
    } );

    test( 'drops inputs whose seq is not an integer', () => {
        for ( const seq of [ 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53, '3', null, undefined ] ) {
            assert.deepEqual( sanitizeInputs( [ { ...valid, seq } ] ), [] );
        }
    } );

    test( 'drops non-object entries and keeps the valid ones in order', () => {
        const a = { ...valid, seq: 1 };
        const b = { ...valid, seq: 2 };
        assert.deepEqual( sanitizeInputs( [ a, null, 3, 'x', [], b ] ), [ a, b ] );
    } );

    test( 'returns nothing when inputs is not an array', () => {
        for ( const raw of [ undefined, null, 5, 'inputs', { 0: valid, length: 1 } ] ) {
            assert.deepEqual( sanitizeInputs( raw ), [] );
        }
    } );

    test( 'caps a batch at the newest MAX_QUEUED_INPUTS inputs', () => {
        const batch = Array.from( { length: MAX_QUEUED_INPUTS + 30 }, ( _, i ) => ( { ...valid, seq: i } ) );
        const out = sanitizeInputs( batch );
        assert.equal( out.length, MAX_QUEUED_INPUTS );
        assert.equal( out[ 0 ]?.seq, 30 );
        assert.equal( out.at( -1 )?.seq, MAX_QUEUED_INPUTS + 29 );
    } );
} );
