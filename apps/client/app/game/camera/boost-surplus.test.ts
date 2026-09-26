import { DEFAULT_SIM_CONFIG, DEFAULT_TUNING } from '@slur/shared';
import { createWorld } from 'koota';
import { describe, expect, it } from 'vitest';
import { LocalPlayer, Sim } from '../ecs/traits';
import { boostSurplus, localBoostSurplus } from './boost-surplus';

const CRUISE = DEFAULT_TUNING.maxCruise;
const FULL = CRUISE * ( 1 + DEFAULT_SIM_CONFIG.boostGain );

describe( 'boostSurplus', () => {
    it( 'is 0 at cruise and 1 at full boost', () => {
        expect( boostSurplus( CRUISE, CRUISE ) ).toBe( 0 );
        expect( boostSurplus( FULL, CRUISE ) ).toBeCloseTo( 1, 9 );
    } );

    it( 'clamps below cruise and above full boost', () => {
        expect( boostSurplus( CRUISE * 0.5, CRUISE ) ).toBe( 0 );
        expect( boostSurplus( FULL * 2, CRUISE ) ).toBe( 1 );
    } );

    it( 'reads 0 without a local ship', () => {
        expect( localBoostSurplus( createWorld() ) ).toBe( 0 );
    } );

    it( 'reads the local ship and drops to 0 when it dies', () => {
        const world = createWorld();
        const e = world.spawn( LocalPlayer, Sim );
        e.set( Sim, ( prev ) => ( { ...prev, vz: FULL } ) );
        expect( localBoostSurplus( world ) ).toBeCloseTo( 1, 9 );
        e.set( Sim, ( prev ) => ( { ...prev, dead: true } ) );
        expect( localBoostSurplus( world ) ).toBe( 0 );
    } );
} );
