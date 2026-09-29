import { emptyInput, INPUT_MESSAGE } from '@slur/shared';
import { describe, expect, it, vi } from 'vitest';
import { INPUT_SEND_TICKS } from '../../net/input-chunks';
import { createPredictor } from '../../net/prediction';
import type { RunRoomLike } from '../../net/run-room-like';
import { type NetFrame, netSendInput } from './net-loop.utils';

function frameWith( ticks: number ) {
    const predictor = createPredictor();
    for ( let i = 1; i <= ticks; i++ ) predictor.record( emptyInput( i ) );
    const send = vi.fn();
    const frame = { predictor, room: { send } as unknown as RunRoomLike, unsentTicks: ticks } as NetFrame;
    return { frame, send };
}

describe( 'netSendInput (#383)', () => {
    it( 'holds a send until INPUT_SEND_TICKS sim ticks are unsent', () => {
        const { frame, send } = frameWith( INPUT_SEND_TICKS - 1 );
        netSendInput( frame );
        expect( send ).not.toHaveBeenCalled();
        expect( frame.unsentTicks ).toBe( INPUT_SEND_TICKS - 1 );
    } );

    it( 'sends every unsent input in one message and resets the tick count', () => {
        const { frame, send } = frameWith( INPUT_SEND_TICKS );
        netSendInput( frame );
        expect( send ).toHaveBeenCalledTimes( 1 );
        expect( send.mock.calls[ 0 ][ 0 ] ).toBe( INPUT_MESSAGE );
        expect( send.mock.calls[ 0 ][ 1 ].inputs.map( ( i: { seq: number } ) => i.seq ) ).toEqual(
            Array.from( { length: INPUT_SEND_TICKS }, ( _, i ) => i + 1 ),
        );
        expect( frame.unsentTicks ).toBe( 0 );
    } );

    it( 'coalesces a catch-up burst into one message', () => {
        const { frame, send } = frameWith( 5 );
        netSendInput( frame );
        expect( send ).toHaveBeenCalledTimes( 1 );
        expect( send.mock.calls[ 0 ][ 1 ].inputs ).toHaveLength( 5 );
    } );
} );
