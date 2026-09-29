import { HeldPower } from '@slur/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { type PowerActions, resetSlot, runPowerAction, selectedSlot, settleSlot } from './power-select';

const { none, bolt, seeker } = HeldPower;

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

    it( 'fireForward, fireBack and drop act on the selected slot (#368)', () => {
        const { act, fired, dirs, dropped } = actions( [ bolt, seeker, bolt ] );
        runPowerAction( 'fireForward', act );
        runPowerAction( 'fireBack', act );
        runPowerAction( 'drop', act );
        expect( fired ).toEqual( [ 0, 0 ] );
        expect( dirs ).toEqual( [ 1, -1 ] );
        expect( dropped ).toEqual( [ 0 ] );
    } );

    it( 'mute and start are not power actions', () => {
        const { act, fired, dropped, ticks } = actions( [ bolt, seeker, bolt ] );
        runPowerAction( 'mute', act );
        runPowerAction( 'start', act );
        expect( fired ).toEqual( [] );
        expect( dropped ).toEqual( [] );
        expect( ticks ).toEqual( [] );
        expect( selectedSlot() ).toBe( 0 );
    } );

    it( 'next cycles to the next full slot and wraps', () => {
        const { act } = actions( [ bolt, none, seeker ] );
        runPowerAction( 'next', act );
        expect( selectedSlot() ).toBe( 2 );
        runPowerAction( 'next', act );
        expect( selectedSlot() ).toBe( 0 );
    } );

    it( 'previous cycles to the previous full slot and wraps', () => {
        const { act } = actions( [ bolt, seeker, none ] );
        runPowerAction( 'previous', act );
        expect( selectedSlot() ).toBe( 1 );
        runPowerAction( 'previous', act );
        expect( selectedSlot() ).toBe( 0 );
        const empty = actions( [ none, none, none ] );
        runPowerAction( 'previous', empty.act );
        expect( selectedSlot() ).toBe( 2 );
    } );

    it( 'next on an empty rack still steps the selection', () => {
        const { act } = actions( [ none, none, none ] );
        runPowerAction( 'next', act );
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

    it( 'ticks on each next or previous that changes the selection, never on fire or drop', () => {
        const { act, ticks } = actions( [ bolt, seeker, bolt ] );
        runPowerAction( 'next', act );
        runPowerAction( 'next', act );
        runPowerAction( 'previous', act );
        runPowerAction( 'fireForward', act );
        runPowerAction( 'drop', act );
        expect( ticks ).toEqual( [ 1, 2, 1 ] );
    } );
} );
