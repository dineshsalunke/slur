import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import { createWorld } from 'koota';
import { describe, expect, it } from 'vitest';
import { Held, LocalPlayer, Sim } from '../../game/ecs/traits';
import { localCombat, localCombatSystem, queueFire, restartLocalCombat } from './local-combat';

const DT = 1 / 60;

function atPickup( power: HeldPower ) {
    const track = resolveTrack( procgenDescriptor( 7 ) );
    const pk = pickupsOf( track ).find( ( a ) => pickupPower( a.id ) === power );
    if ( ! pk ) throw new Error( `no pickup of power ${ power }` );
    const world = createWorld();
    const ship = world.spawn( LocalPlayer, Sim, Held );
    ship.set( Sim, ( prev ) => ( { ...prev, x: pk.x, z: pk.z } ) );
    localCombatSystem( world, DT, track );
    return { world, ship, track };
}

describe( 'test-level local combat', () => {
    it( 'a seeker pickup is held as a seeker and fires a seeker, not a bolt', () => {
        const { world, ship, track } = atPickup( HeldPower.seeker );
        expect( ship.get( Held )?.power ).toBe( HeldPower.seeker );

        queueFire();
        localCombatSystem( world, DT, track );

        expect( localCombat.seekers.size ).toBe( 1 );
        expect( localCombat.bolts.size ).toBe( 0 );
        expect( ship.get( Held )?.power ).toBe( HeldPower.none );
    } );

    it( 'a bolt pickup is held as a bolt and fires a bolt', () => {
        const { world, ship, track } = atPickup( HeldPower.bolt );
        expect( ship.get( Held )?.power ).toBe( HeldPower.bolt );

        queueFire();
        localCombatSystem( world, DT, track );

        expect( localCombat.bolts.size ).toBe( 1 );
        expect( localCombat.seekers.size ).toBe( 0 );
    } );

    it( 'a restart drops the held power and every seeker in flight', () => {
        const { world, ship, track } = atPickup( HeldPower.seeker );
        queueFire();
        localCombatSystem( world, DT, track );
        ship.set( Held, { power: HeldPower.seeker } );
        expect( localCombat.seekers.size ).toBe( 1 );

        restartLocalCombat( world, track );

        expect( ship.get( Held )?.power ).toBe( HeldPower.none );
        expect( localCombat.seekers.size ).toBe( 0 );
        expect( localCombat.bolts.size ).toBe( 0 );
        expect( localCombat.taken.size ).toBe( 0 );
    } );
} );
