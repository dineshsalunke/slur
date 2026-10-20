import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { POWER_SLOTS } from '../combat/constants.js';
import { COLOR_COUNT } from '../constants.js';
import {
    applyRunCommand,
    type CommandTarget,
    isRunCommand,
    RUN_COMMAND_FORMATS,
    RUN_COMMAND_HANDLERS,
    RUN_COMMAND_TYPES,
    type RunCommandType,
} from './run-commands.js';

type Call = readonly [ method: string, sessionId: string, ...args: unknown[] ];

const MALFORMED: readonly unknown[] = [ undefined, null, 'x', -7, [], {}, { junk: true } ];

function recorder(): { target: CommandTarget; calls: Call[] } {
    const calls: Call[] = [];
    const target: CommandTarget = {
        input: ( id, message ) => calls.push( [ 'input', id, message ] ),
        setClass: ( id, shipId ) => calls.push( [ 'setClass', id, shipId ] ),
        setColor: ( id, colorId ) => calls.push( [ 'setColor', id, colorId ] ),
        start: ( id ) => calls.push( [ 'start', id ] ),
        restart: ( id ) => calls.push( [ 'restart', id ] ),
        endRace: ( id ) => calls.push( [ 'endRace', id ] ),
        usePower: ( id, message ) => calls.push( [ 'usePower', id, message ] ),
        dropPower: ( id, message ) => calls.push( [ 'dropPower', id, message ] ),
    };
    return { target, calls };
}

function apply( type: RunCommandType, raw: unknown ): Call | undefined {
    const { target, calls } = recorder();
    applyRunCommand( target, 's', type, raw );
    assert.equal( calls.length, 1, `${ type } calls its handler exactly once` );
    return calls[ 0 ];
}

describe( 'run command table', () => {
    test( 'lists every command once, and the formats and handlers cover the same set', () => {
        assert.equal( new Set( RUN_COMMAND_TYPES ).size, RUN_COMMAND_TYPES.length );
        assert.deepEqual( Object.keys( RUN_COMMAND_FORMATS ).sort(), [ ...RUN_COMMAND_TYPES ].sort() );
        assert.deepEqual( Object.keys( RUN_COMMAND_HANDLERS ).sort(), [ ...RUN_COMMAND_TYPES ].sort() );
    } );

    test( 'isRunCommand accepts the table keys only', () => {
        for ( const type of RUN_COMMAND_TYPES ) assert.ok( isRunCommand( type ) );
        for ( const type of [ 'kick', 'chat', 'toString', '__proto__', '' ] ) assert.ok( ! isRunCommand( type ) );
    } );

    test( 'no format throws on any payload, so Colyseus never kicks the sender', () => {
        const odd = [
            ...MALFORMED,
            Number.NaN,
            { inputs: null },
            { slot: { valueOf: () => 1 } },
            Object.create( null ),
        ];
        for ( const type of RUN_COMMAND_TYPES ) {
            for ( const raw of odd ) {
                const result = RUN_COMMAND_FORMATS[ type ][ '~standard' ].validate( raw );
                assert.ok( ! ( 'issues' in result ), `${ type } never reports issues` );
            }
        }
    } );
} );

describe( 'input', () => {
    const valid = { seq: 3, throttle: 0.5, brake: 0, strafe: -1, jump: true };

    test( 'passes sanitised inputs and ignores extra keys', () => {
        assert.deepEqual( apply( 'input', { inputs: [ valid ], pad: 'x' } ), [ 'input', 's', { inputs: [ valid ] } ] );
    } );

    test( 'turns a malformed payload into an empty batch', () => {
        for ( const raw of [ ...MALFORMED, { inputs: null }, { inputs: 'x' } ] )
            assert.deepEqual( apply( 'input', raw ), [ 'input', 's', { inputs: [] } ] );
    } );
} );

describe( 'setClass', () => {
    test( 'passes a known ship id', () => {
        assert.deepEqual( apply( 'setClass', 'bob' ), [ 'setClass', 's', 'bob' ] );
    } );

    test( 'turns anything else into null', () => {
        for ( const raw of [ ...MALFORMED, 'nope', { id: 'bob' } ] )
            assert.deepEqual( apply( 'setClass', raw ), [ 'setClass', 's', null ] );
    } );
} );

describe( 'setColor', () => {
    test( 'passes an in-range integer', () => {
        assert.deepEqual( apply( 'setColor', COLOR_COUNT - 1 ), [ 'setColor', 's', COLOR_COUNT - 1 ] );
    } );

    test( 'turns anything else into null', () => {
        for ( const raw of [ ...MALFORMED, Number.NaN, 1.5, -1, COLOR_COUNT, '3' ] )
            assert.deepEqual( apply( 'setColor', raw ), [ 'setColor', 's', null ] );
    } );
} );

describe( 'start, restart and endRace', () => {
    test( 'ignore the payload', () => {
        for ( const type of [ 'start', 'restart', 'endRace' ] as const ) {
            for ( const raw of [ ...MALFORMED, { host: true } ] ) assert.deepEqual( apply( type, raw ), [ type, 's' ] );
        }
    } );
} );

describe( 'usePowerUp', () => {
    test( 'passes a parsed fire intent and ignores extra keys', () => {
        assert.deepEqual( apply( 'usePowerUp', { slot: 1, dir: -1, seq: 9, pad: 1 } ), [
            'usePower',
            's',
            { slot: 1, dir: -1, seq: 9 },
        ] );
    } );

    test( 'defaults dir to forward and seq to 0', () => {
        assert.deepEqual( apply( 'usePowerUp', { slot: 0, dir: 'back', seq: 1.5 } ), [
            'usePower',
            's',
            { slot: 0, dir: 1, seq: 0 },
        ] );
    } );

    test( 'still reaches usePower with undefined for a bad slot', () => {
        for ( const raw of [ ...MALFORMED, { slot: -1 }, { slot: 0.5 }, { slot: POWER_SLOTS } ] )
            assert.deepEqual( apply( 'usePowerUp', raw ), [ 'usePower', 's', undefined ] );
    } );
} );

describe( 'dropPowerUp', () => {
    test( 'passes the slot only', () => {
        assert.deepEqual( apply( 'dropPowerUp', { slot: 2, dir: -1 } ), [ 'dropPower', 's', { slot: 2 } ] );
    } );

    test( 'still reaches dropPower with undefined for a bad slot', () => {
        for ( const raw of [ ...MALFORMED, { slot: -1 }, { slot: 0.5 }, { slot: POWER_SLOTS } ] )
            assert.deepEqual( apply( 'dropPowerUp', raw ), [ 'dropPower', 's', undefined ] );
    } );
} );
