import { FIXED_DT, procgenDescriptor, START_MESSAGE } from '@slur/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { MAX_TAKES } from './flight-recorder.constants';
import { attachRecorder, clearTakes, recorderView, startTake, stopTake } from './flight-recorder.state';

function flown( seconds: number ): LoopbackRoom {
    const room = new LoopbackRoom( procgenDescriptor( 1, 'phrase' ), { countdownSeconds: 0 } );
    room.send( START_MESSAGE );
    attachRecorder( room );
    startTake();
    for ( let t = 0; t < seconds; t += FIXED_DT ) room.step( FIXED_DT );
    return room;
}

describe( 'flight recorder', () => {
    afterEach( () => {
        stopTake();
        clearTakes();
    } );

    it( 'records one point per tick into the newest take', () => {
        flown( 1 );
        expect( recorderView().recording ).toBe( true );
        expect( recorderView().seconds ).toBe( 1 );
        stopTake();
        const [ take ] = recorderView().takes;
        expect( recorderView().recording ).toBe( false );
        expect( take.ticks ).toBeGreaterThanOrEqual( 59 );
        expect( take.runs.flat().length ).toBe( take.ticks );
    } );

    it( 'keeps the last takes, newest first', () => {
        const ids: number[] = [];
        for ( let i = 0; i <= MAX_TAKES; i++ ) {
            flown( 0.1 );
            stopTake();
            ids.unshift( recorderView().takes[ 0 ].id );
        }
        expect( recorderView().takes.map( ( t ) => t.id ) ).toEqual( ids.slice( 0, MAX_TAKES ) );
    } );

    it( 'a new room ends the live take', () => {
        flown( 0.2 );
        attachRecorder( new LoopbackRoom( procgenDescriptor( 1, 'phrase' ) ) );
        expect( recorderView().recording ).toBe( false );
        expect( recorderView().takes ).toHaveLength( 1 );
    } );
} );
