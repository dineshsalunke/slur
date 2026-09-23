import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { createWorld } from 'koota';
import { beforeEach, describe, expect, it } from 'vitest';
import { Held, LocalPlayer, Sim } from '../../game/ecs/traits';
import { resetSlot, selectedSlot } from '../../game/input/power-select';
import { localCombat, localCombatSystem, queueDrop, queueFire, restartLocalCombat } from './local-combat';

const DT = 1 / 60;
const { none, bolt, seeker } = HeldPower;

function atPickup( power: HeldPower, slots: number[] = [ none, none, none ] ) {
    const track = resolveTrack( procgenDescriptor( 7 ) );
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
    beforeEach( resetSlot );

    it( 'a seeker pickup fills slot 0 and fires a seeker, not a bolt', () => {
        const { world, ship, track } = atPickup( seeker );
        expect( rack( ship ) ).toEqual( [ seeker, none, none ] );

        queueFire( 0 );
        localCombatSystem( world, DT, track );

        expect( localCombat.seekers.size ).toBe( 1 );
        expect( localCombat.bolts.size ).toBe( 0 );
        expect( rack( ship ) ).toEqual( [ none, none, none ] );
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

    it( 'a second seeker waits while the first is in flight, and its slot is kept', () => {
        const { world, ship, track } = atPickup( bolt, [ seeker, seeker, bolt ] );
        leavePickup( ship );
        queueFire( 0 );
        localCombatSystem( world, DT, track );
        queueFire( 1 );
        localCombatSystem( world, DT, track );

        expect( localCombat.seekers.size ).toBe( 1 );
        expect( rack( ship ) ).toEqual( [ none, seeker, bolt ] );
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
