import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ServerError } from '@colyseus/core';
import { guardInvoke, type MatchmakeCall, type MatchmakeGate } from './matchmake-guard.js';

const auth = ( ip: string ) => ( { ip, headers: new Headers() } );

test( 'matchmake guard: every gate admits the call, keyed on the last forwarded hop, before the invoke', async () => {
    const seen: string[] = [];
    const gate: MatchmakeGate = { admit: ( call ) => seen.push( `${ call.method }:${ call.roomName }@${ call.ip }` ) };
    const invoke = guardInvoke( async () => {
        seen.push( 'invoke' );
        return 'seat';
    }, [ gate ] );
    assert.equal( await invoke( 'joinById', 'K7QXM', {}, auth( 'spoof, 203.0.113.7' ) ), 'seat' );
    assert.deepEqual( seen, [ 'joinById:K7QXM@203.0.113.7', 'invoke' ] );
} );

test( 'matchmake guard: a gate that throws stops the call and the invoke never runs', async () => {
    let invoked = false;
    const invoke = guardInvoke( async () => {
        invoked = true;
    }, [
        {
            admit: () => {
                throw new ServerError( 429, 'slow down' );
            },
        },
    ] );
    await assert.rejects( invoke( 'joinById', 'K7QXM' ), { code: 429 } );
    assert.equal( invoked, false );
} );

test( 'matchmake guard: a failed invoke reaches every gate, then rethrows unchanged', async () => {
    const failures: Array< [ MatchmakeCall, unknown, number ] > = [];
    const error = new ServerError( 522, 'room "K7QXM" not found' );
    const invoke = guardInvoke(
        async () => {
            throw error;
        },
        [ { failed: ( call, e, t ) => failures.push( [ call, e, t ] ) } ],
        () => 42,
    );
    await assert.rejects( invoke( 'joinById', 'K7QXM', {}, auth( '198.51.100.2' ) ), ( e ) => e === error );
    assert.deepEqual( failures, [ [ { method: 'joinById', roomName: 'K7QXM', ip: '198.51.100.2' }, error, 42 ] ] );
} );
