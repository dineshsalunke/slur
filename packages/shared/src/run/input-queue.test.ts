import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
    clearQueue,
    emptyQueue,
    enqueueFire,
    enqueueInputs,
    inputsThisTick,
    MAX_CATCHUP_INPUTS,
    MAX_QUEUED_FIRES,
    MAX_QUEUED_INPUTS,
    sanitizeInputs,
    TARGET_QUEUED_INPUTS,
    takeFire,
} from './input-queue.js';

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

describe( 'inputsThisTick', () => {
    test( 'takes one input a tick while the queue is at or under the target', () => {
        assert.equal( inputsThisTick( 0 ), 0 );
        for ( let queued = 1; queued <= TARGET_QUEUED_INPUTS + 1; queued++ )
            assert.equal( inputsThisTick( queued ), 1 );
    } );

    test( 'catches up by at most MAX_CATCHUP_INPUTS extra and never undershoots the target', () => {
        for ( let queued = TARGET_QUEUED_INPUTS + 2; queued <= MAX_QUEUED_INPUTS; queued++ ) {
            const n = inputsThisTick( queued );
            assert.ok( n >= 2 && n <= 1 + MAX_CATCHUP_INPUTS, `queued ${ queued } takes ${ n }` );
            assert.ok( queued - n >= TARGET_QUEUED_INPUTS, `queued ${ queued } keeps the target` );
        }
    } );

    test( 'a 24-input backlog from a 400 ms stall is back at the target within 10 ticks', () => {
        let queued = 24;
        let ticks = 0;
        while ( queued > TARGET_QUEUED_INPUTS + 1 ) {
            queued = queued - inputsThisTick( queued ) + 1;
            ticks++;
        }
        assert.ok( ticks <= 10, `drained in ${ ticks } ticks` );
    } );
} );

describe( 'fire queue', () => {
    test( 'keeps a valid slot, forces dir to ±1, and treats a missing seq as 0', () => {
        const q = emptyQueue();
        enqueueFire( q, { slot: 1, dir: -1, seq: 9 } );
        enqueueFire( q, { slot: 0, dir: 7 } );
        enqueueFire( q, { slot: 9 } );
        enqueueFire( q, null );
        assert.deepEqual( q.fires, [
            { slot: 1, dir: -1, seq: 9 },
            { slot: 0, dir: 1, seq: 0 },
        ] );
    } );

    test( 'holds a fire until its input seq is processed', () => {
        const q = emptyQueue();
        enqueueFire( q, { slot: 0, seq: 5 } );
        assert.equal( takeFire( q, 4 ), undefined );
        assert.deepEqual( takeFire( q, 5 ), { slot: 0, dir: 1, seq: 5 } );
        assert.equal( q.fires.length, 0 );
    } );

    test( 'caps the queue at MAX_QUEUED_FIRES, dropping the oldest', () => {
        const q = emptyQueue();
        for ( let seq = 1; seq <= MAX_QUEUED_FIRES + 2; seq++ ) enqueueFire( q, { slot: 0, seq } );
        assert.equal( q.fires.length, MAX_QUEUED_FIRES );
        assert.equal( q.fires[ 0 ]?.seq, 3 );
    } );

    test( 'clearQueue empties inputs and fires', () => {
        const q = emptyQueue();
        enqueueInputs( q, [ valid ] );
        enqueueFire( q, { slot: 0 } );
        clearQueue( q );
        assert.deepEqual( q, emptyQueue() );
    } );
} );
