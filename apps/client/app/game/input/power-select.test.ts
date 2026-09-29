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

    it( 'E fires forward, D fires back and X drops the selected slot (#368)', () => {
        const { act, fired, dirs, dropped } = actions( [ bolt, seeker, bolt ] );
        handlePowerKey( key( 'KeyE' ), act );
        handlePowerKey( key( 'KeyD' ), act );
        handlePowerKey( key( 'KeyX' ), act );
        expect( fired ).toEqual( [ 0, 0 ] );
        expect( dirs ).toEqual( [ 1, -1 ] );
        expect( dropped ).toEqual( [ 0 ] );
    } );

    it( 'no old key does anything (#368)', () => {
        const { act, fired, dropped, ticks } = actions( [ bolt, seeker, bolt ] );
        for ( const code of [
            'ControlRight',
            'ControlLeft',
            'ShiftLeft',
            'ShiftRight',
            'ArrowUp',
            'Digit2',
            'Digit3',
            'KeyR',
        ] ) {
            handlePowerKey( key( code ), act );
        }
        expect( fired ).toEqual( [] );
        expect( dropped ).toEqual( [] );
        expect( ticks ).toEqual( [] );
        expect( selectedSlot() ).toBe( 0 );
    } );

    it( 'Ctrl, Meta and Alt leave the key to the browser; Shift does not block it', () => {
        const { act, fired } = actions( [ bolt, seeker, bolt ] );
        handlePowerKey( key( 'KeyE', { ctrlKey: true } ), act );
        handlePowerKey( key( 'KeyE', { metaKey: true } ), act );
        handlePowerKey( key( 'KeyE', { altKey: true } ), act );
        handlePowerKey( key( 'KeyF', { ctrlKey: true } ), act );
        expect( fired ).toEqual( [] );
        expect( selectedSlot() ).toBe( 0 );
        handlePowerKey( key( 'KeyE', { shiftKey: true } ), act );
        expect( fired ).toEqual( [ 0 ] );
    } );

    it( 'F cycles to the next full slot and wraps', () => {
        const { act } = actions( [ bolt, none, seeker ] );
        handlePowerKey( key( 'KeyF' ), act );
        expect( selectedSlot() ).toBe( 2 );
        handlePowerKey( key( 'KeyF' ), act );
        expect( selectedSlot() ).toBe( 0 );
    } );

    it( 'S cycles to the previous full slot and wraps', () => {
        const { act } = actions( [ bolt, seeker, none ] );
        handlePowerKey( key( 'KeyS' ), act );
        expect( selectedSlot() ).toBe( 1 );
        handlePowerKey( key( 'KeyS' ), act );
        expect( selectedSlot() ).toBe( 0 );
        const empty = actions( [ none, none, none ] );
        handlePowerKey( key( 'KeyS' ), empty.act );
        expect( selectedSlot() ).toBe( 2 );
    } );

    it( 'F on an empty rack still steps the selection', () => {
        const { act } = actions( [ none, none, none ] );
        handlePowerKey( key( 'KeyF' ), act );
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

    it( 'ticks on each S or F that changes the selection, never on fire or drop', () => {
        const { act, ticks } = actions( [ bolt, seeker, bolt ] );
        handlePowerKey( key( 'KeyF' ), act );
        handlePowerKey( key( 'KeyF' ), act );
        handlePowerKey( key( 'KeyS' ), act );
        handlePowerKey( key( 'KeyE' ), act );
        handlePowerKey( key( 'KeyX' ), act );
        expect( ticks ).toEqual( [ 1, 2, 1 ] );
    } );

    it( 'repeated keys are ignored', () => {
        const { act, fired } = actions( [ bolt, bolt, bolt ] );
        handlePowerKey( key( 'KeyF', { repeat: true } ), act );
        handlePowerKey( key( 'KeyE', { repeat: true } ), act );
        expect( selectedSlot() ).toBe( 0 );
        expect( fired ).toEqual( [] );
    } );
} );
