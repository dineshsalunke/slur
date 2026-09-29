import { HeldPower } from '@slur/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { handlePowerKey, type PowerActions, resetSlot, selectedSlot, settleSlot } from './power-select';

const { none, bolt, seeker } = HeldPower;

function key( code: string, extra: Partial< KeyboardEvent > = {} ): KeyboardEvent {
    return {
        code,
        repeat: false,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        target: null,
        ...extra,
    } as KeyboardEvent;
}

function actions( rack: number[] ) {
    const fired: number[] = [];
    const dirs: number[] = [];
    const dropped: number[] = [];
    const ticks: number[] = [];
    const act: PowerActions = {
        rack: () => rack,
        fire: ( s, dir ) => {
            fired.push( s );
            dirs.push( dir );
        },
        drop: ( s ) => dropped.push( s ),
        tick: () => ticks.push( selectedSlot() ),
    };
    return { act, fired, dirs, dropped, ticks };
}

describe( 'power slot selection', () => {
    beforeEach( resetSlot );

    it( '1/2/3 select a slot, E fires it and X drops it', () => {
        const { act, fired, dropped } = actions( [ bolt, seeker, bolt ] );
        handlePowerKey( key( 'Digit2' ), act );
        expect( selectedSlot() ).toBe( 1 );
        handlePowerKey( key( 'KeyE' ), act );
        handlePowerKey( key( 'Digit3' ), act );
        handlePowerKey( key( 'KeyX' ), act );
        expect( fired ).toEqual( [ 1 ] );
        expect( dropped ).toEqual( [ 2 ] );
    } );

    it( 'E fires the selected slot forward and F fires it back', () => {
        const { act, fired, dirs } = actions( [ bolt, seeker, bolt ] );
        handlePowerKey( key( 'Digit2' ), act );
        handlePowerKey( key( 'KeyE' ), act );
        handlePowerKey( key( 'KeyF' ), act );
        expect( fired ).toEqual( [ 1, 1 ] );
        expect( dirs ).toEqual( [ 1, -1 ] );
    } );

    it( 'Blur keys: Right Ctrl and Left Shift fire forward, Right Shift fires back, Left Ctrl drops', () => {
        const { act, fired, dirs, dropped } = actions( [ bolt, seeker, bolt ] );
        handlePowerKey( key( 'ControlRight', { ctrlKey: true } ), act );
        handlePowerKey( key( 'ShiftLeft', { shiftKey: true } ), act );
        handlePowerKey( key( 'ShiftRight', { shiftKey: true } ), act );
        handlePowerKey( key( 'ControlLeft', { ctrlKey: true } ), act );
        expect( fired ).toEqual( [ 0, 0, 0 ] );
        expect( dirs ).toEqual( [ 1, 1, -1 ] );
        expect( dropped ).toEqual( [ 0 ] );
    } );

    it( 'Up cycles while Shift is held, but Ctrl or Shift with a letter is ignored', () => {
        const { act, fired } = actions( [ bolt, seeker, none ] );
        handlePowerKey( key( 'ArrowUp', { shiftKey: true } ), act );
        expect( selectedSlot() ).toBe( 1 );
        handlePowerKey( key( 'KeyR', { ctrlKey: true } ), act );
        handlePowerKey( key( 'KeyE', { shiftKey: true } ), act );
        expect( selectedSlot() ).toBe( 1 );
        expect( fired ).toEqual( [] );
    } );

    it( 'Up cycles to the next full slot and wraps', () => {
        const { act } = actions( [ bolt, none, seeker ] );
        handlePowerKey( key( 'ArrowUp' ), act );
        expect( selectedSlot() ).toBe( 2 );
        handlePowerKey( key( 'ArrowUp' ), act );
        expect( selectedSlot() ).toBe( 0 );
    } );

    it( 'R cycles to the previous full slot and wraps (#346)', () => {
        const { act } = actions( [ bolt, seeker, none ] );
        handlePowerKey( key( 'KeyR' ), act );
        expect( selectedSlot() ).toBe( 1 );
        handlePowerKey( key( 'KeyR' ), act );
        expect( selectedSlot() ).toBe( 0 );
        const empty = actions( [ none, none, none ] );
        handlePowerKey( key( 'KeyR' ), empty.act );
        expect( selectedSlot() ).toBe( 2 );
    } );

    it( 'Up on an empty rack still steps the selection', () => {
        const { act } = actions( [ none, none, none ] );
        handlePowerKey( key( 'ArrowUp' ), act );
        expect( selectedSlot() ).toBe( 1 );
    } );

    it( 'an emptied selection advances to the next full slot', () => {
        settleSlot( [ none, bolt, seeker ] );
        expect( selectedSlot() ).toBe( 1 );
        settleSlot( [ none, none, seeker ] );
        expect( selectedSlot() ).toBe( 2 );
    } );

    it( 'a full selection and an empty rack both keep the selection', () => {
        settleSlot( [ bolt, seeker, none ] );
        expect( selectedSlot() ).toBe( 0 );
        settleSlot( [ none, none, none ] );
        expect( selectedSlot() ).toBe( 0 );
    } );

    it( 'ticks on each Up or digit that changes the selection, never on fire, drop or a same-slot digit', () => {
        const { act, ticks } = actions( [ bolt, seeker, bolt ] );
        handlePowerKey( key( 'Digit1' ), act );
        handlePowerKey( key( 'ArrowUp' ), act );
        handlePowerKey( key( 'Digit3' ), act );
        handlePowerKey( key( 'KeyE' ), act );
        handlePowerKey( key( 'KeyX' ), act );
        expect( ticks ).toEqual( [ 1, 2 ] );
    } );

    it( 'modified and repeated keys are ignored', () => {
        const { act, fired } = actions( [ bolt, bolt, bolt ] );
        handlePowerKey( key( 'Digit2', { shiftKey: true } ), act );
        handlePowerKey( key( 'KeyE', { repeat: true } ), act );
        expect( selectedSlot() ).toBe( 0 );
        expect( fired ).toEqual( [] );
    } );
} );
