import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { createWorld } from 'koota';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { playSfx } from '../../audio/sfx-map';
import { Held, LocalPlayer, Sim } from '../../game/ecs/traits';
import { resetSlot, selectedSlot } from '../../game/input/power-select';
import { drainMineShocks, type MineShock } from '../../game/scene/mine-shock-events';
import { localCombat, localCombatSystem, queueDrop, queueFire, restartLocalCombat } from './local-combat';

vi.mock( '../../audio/sfx-map', () => ( { playSfx: vi.fn() } ) );

const DT = 1 / 60;
const { none, bolt, seeker, mine } = HeldPower;

function atPickup( power: HeldPower, slots: number[] = [ none, none, none ] ) {
    const track = resolveTrack( procgenDescriptor( 7, 'weave' ) );
    const pk = pickupsOf( track ).find( ( a ) => pickupPower( a.id ) === power );
    if ( ! pk ) throw new Error( `no pickup of power ${ power }` );
    const world = createWorld();
    const ship = world.spawn( LocalPlayer, Sim, Held );
    ship.set( Held, { slots } );
    ship.set( Sim, ( prev ) => ( { ...prev, x: pk.x, z: pk.z } ) );
    localCombatSystem( world, DT, track );
    return { world, ship, track };
}

type Ship = ReturnType< typeof atPickup >[ 'ship' ];

function rack( ship: Ship ): number[] | undefined {
    return ship.get( Held )?.slots;
}

function leavePickup( ship: Ship ): void {
    ship.set( Sim, ( prev ) => ( { ...prev, x: 1e4 } ) );
}

describe( 'test-level local combat', () => {
    beforeEach( () => {
        resetSlot();
        vi.mocked( playSfx ).mockClear();
    } );

    it( 'a pickup plays the pickup sound once', () => {
        const { world, track } = atPickup( seeker );
        localCombatSystem( world, DT, track );

        expect( vi.mocked( playSfx ).mock.calls ).toEqual( [ [ 'pickup' ] ] );
    } );

    it( 'a full rack plays no pickup sound', () => {
        atPickup( bolt, [ seeker, seeker, seeker ] );
        expect( playSfx ).not.toHaveBeenCalled();
    } );

    it( 'firing and dropping play no pickup sound', () => {
        const { world, ship, track } = atPickup( bolt, [ seeker, bolt, none ] );
        vi.mocked( playSfx ).mockClear();
        leavePickup( ship );
        queueFire( 0 );
        localCombatSystem( world, DT, track );
        queueDrop( 1 );
        localCombatSystem( world, DT, track );

        expect( playSfx ).not.toHaveBeenCalled();
    } );

    it( 'a seeker pickup fills slot 0 and fires a seeker, not a bolt', () => {
        const { world, ship, track } = atPickup( seeker );
        expect( rack( ship ) ).toEqual( [ seeker, none, none ] );

        queueFire( 0 );
        localCombatSystem( world, DT, track );

        expect( localCombat.seekers.size ).toBe( 1 );
        expect( localCombat.bolts.size ).toBe( 0 );
        expect( rack( ship ) ).toEqual( [ none, none, none ] );
    } );

    it( 'a mine fired off the deck spends the power, lays nothing and fizzles once', () => {
        const { world, ship, track } = atPickup( bolt, [ mine, none, none ] );
        leavePickup( ship );
        drainMineShocks( () => {} );
        vi.mocked( playSfx ).mockClear();
        queueFire( 0 );
        localCombatSystem( world, DT, track );

        const shocks: MineShock[] = [];
        drainMineShocks( ( e ) => shocks.push( e ) );
        expect( rack( ship ) ).toEqual( [ none, bolt, none ] );
        expect( localCombat.mines.size ).toBe( 0 );
        expect( shocks.map( ( e ) => e.kind ) ).toEqual( [ 'fizzle' ] );
        expect( vi.mocked( playSfx ).mock.calls ).toEqual( [ [ 'mineFizzle' ] ] );
    } );

    it( 'a grab fills the lowest empty slot', () => {
        const { ship } = atPickup( bolt, [ seeker, none, none ] );
        expect( rack( ship ) ).toEqual( [ seeker, bolt, none ] );
    } );

    it( 'a full rack skips the pickup', () => {
        const { ship } = atPickup( bolt, [ seeker, seeker, seeker ] );
        expect( rack( ship ) ).toEqual( [ seeker, seeker, seeker ] );
        expect( localCombat.taken.size ).toBe( 0 );
    } );

    it( 'seekers fire back to back', () => {
        const { world, ship, track } = atPickup( bolt, [ seeker, seeker, bolt ] );
        leavePickup( ship );
        queueFire( 0 );
        localCombatSystem( world, DT, track );
        queueFire( 1 );
        localCombatSystem( world, DT, track );

        expect( localCombat.seekers.size ).toBe( 2 );
        expect( rack( ship ) ).toEqual( [ none, none, bolt ] );
    } );

    it( 'a drop empties the slot and fires nothing', () => {
        const { world, ship, track } = atPickup( bolt, [ seeker, bolt, bolt ] );
        leavePickup( ship );
        queueDrop( 0 );
        localCombatSystem( world, DT, track );

        expect( rack( ship ) ).toEqual( [ none, bolt, bolt ] );
        expect( localCombat.seekers.size ).toBe( 0 );
        expect( localCombat.bolts.size ).toBe( 0 );
    } );

    it( 'emptying the selected slot advances the selection to the next full slot', () => {
        const { world, track } = atPickup( bolt, [ bolt, none, seeker ] );
        queueFire( 0 );
        localCombatSystem( world, DT, track );
        expect( selectedSlot() ).toBe( 1 );
    } );

    it( 'a restart empties the rack and every seeker in flight', () => {
        const { world, ship, track } = atPickup( seeker );
        queueFire( 0 );
        localCombatSystem( world, DT, track );
        ship.set( Held, { slots: [ seeker, bolt, seeker ] } );
        expect( localCombat.seekers.size ).toBe( 1 );

        restartLocalCombat( world, track );

        expect( rack( ship ) ).toEqual( [ none, none, none ] );
        expect( localCombat.seekers.size ).toBe( 0 );
        expect( localCombat.bolts.size ).toBe( 0 );
        expect( localCombat.taken.size ).toBe( 0 );
    } );
} );
