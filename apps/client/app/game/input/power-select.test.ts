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
    const dropped: number[] = [];
    const act: PowerActions = {
        rack: () => rack,
        fire: ( s ) => fired.push( s ),
        drop: ( s ) => dropped.push( s ),
    };
    return { act, fired, dropped };
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

    it( 'Q cycles to the next full slot and wraps', () => {
        const { act } = actions( [ bolt, none, seeker ] );
        handlePowerKey( key( 'KeyQ' ), act );
        expect( selectedSlot() ).toBe( 2 );
        handlePowerKey( key( 'KeyQ' ), act );
        expect( selectedSlot() ).toBe( 0 );
    } );

    it( 'Q on an empty rack still steps the selection', () => {
        const { act } = actions( [ none, none, none ] );
        handlePowerKey( key( 'KeyQ' ), act );
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

    it( 'modified and repeated keys are ignored', () => {
        const { act, fired } = actions( [ bolt, bolt, bolt ] );
        handlePowerKey( key( 'Digit2', { shiftKey: true } ), act );
        handlePowerKey( key( 'KeyE', { repeat: true } ), act );
        expect( selectedSlot() ).toBe( 0 );
        expect( fired ).toEqual( [] );
    } );
} );
