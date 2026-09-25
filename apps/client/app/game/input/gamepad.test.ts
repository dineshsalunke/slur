import { emptyInput } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { JUMP_EDGE, type PadLike, padEdges, readPad, STICK_DEADZONE } from './gamepad';

function pad( { axes = [ 0, 0 ], down = {} as Record< number, number > } = {} ): PadLike {
    const buttons = Array.from( { length: 17 }, ( _, i ) => {
        const v = down[ i ] ?? 0;
        return { pressed: v > 0.5, touched: v > 0, value: v };
    } );
    return { axes, buttons } as unknown as PadLike;
}

function edges( p: PadLike, was: boolean[] ): string[] {
    const out: string[] = [];
    padEdges( p, was, ( c ) => out.push( c ) );
    return out;
}

describe( 'readPad', () => {
    it( 'maps the triggers to analog throttle and brake', () => {
        const out = emptyInput();
        readPad( pad( { down: { 7: 0.6, 6: 0.3 } } ), out );
        expect( out.throttle ).toBeCloseTo( 0.6 );
        expect( out.brake ).toBeCloseTo( 0.3 );
    } );

    it( 'strafes left on a left stick, like A', () => {
        const out = emptyInput();
        readPad( pad( { axes: [ -1, 0 ] } ), out );
        expect( out.strafe ).toBe( 1 );
    } );

    it( 'ignores the stick inside the deadzone', () => {
        const out = emptyInput();
        readPad( pad( { axes: [ STICK_DEADZONE * 0.9, 0 ] } ), out );
        expect( out.strafe ).toBe( 0 );
    } );

    it( 'rescales past the deadzone to reach full strafe', () => {
        const out = emptyInput();
        readPad( pad( { axes: [ 0.6, 0 ] } ), out );
        expect( out.strafe ).toBeCloseTo( -0.5 );
    } );

    it( 'prefers the d-pad over the stick', () => {
        const out = emptyInput();
        readPad( pad( { axes: [ -1, 0 ], down: { 15: 1 } } ), out );
        expect( out.strafe ).toBe( -1 );
    } );

    it( 'holds jump while A is down', () => {
        const out = emptyInput();
        readPad( pad( { down: { 0: 1 } } ), out );
        expect( out.jump ).toBe( true );
    } );
} );

describe( 'padEdges', () => {
    it( 'emits each discrete action once per press', () => {
        const was: boolean[] = [];
        expect( edges( pad( { down: { 2: 1, 9: 1, 0: 1 } } ), was ) ).toEqual( [ JUMP_EDGE, 'KeyE', 'Enter' ] );
        expect( edges( pad( { down: { 2: 1, 9: 1, 0: 1 } } ), was ) ).toEqual( [] );
        expect( edges( pad(), was ) ).toEqual( [] );
        expect( edges( pad( { down: { 2: 1 } } ), was ) ).toEqual( [ 'KeyE' ] );
    } );

    it( 'maps B to fire back', () => {
        expect( edges( pad( { down: { 1: 1 } } ), [] ) ).toEqual( [ 'KeyF' ] );
    } );

    it( 'maps cycle and mute', () => {
        expect( edges( pad( { down: { 3: 1, 8: 1 } } ), [] ) ).toEqual( [ 'KeyQ', 'KeyM' ] );
    } );
} );
