import { DEFAULT_SIM_CONFIG, type SimConfig } from '@slur/shared';
import { createWorld } from 'koota';
import { describe, expect, it } from 'vitest';
import { holdRunConfig, runConfig } from './run-config';

describe( 'runConfig', () => {
    it( 'is the default config when no room holds one', () => {
        expect( runConfig( createWorld() ) ).toBe( DEFAULT_SIM_CONFIG );
    } );

    it( 'reads the held config by reference, so live getters stay live', () => {
        const world = createWorld();
        let grab = 1;
        const tuned: SimConfig = {
            ...DEFAULT_SIM_CONFIG,
            get pickupGrabR() {
                return grab;
            },
        };
        holdRunConfig( world, tuned );
        expect( runConfig( world ) ).toBe( tuned );
        grab = 7;
        expect( runConfig( world ).pickupGrabR ).toBe( 7 );
    } );

    it( 'falls back to the default when the holder lets go', () => {
        const world = createWorld();
        const release = holdRunConfig( world, { ...DEFAULT_SIM_CONFIG } );
        release();
        expect( runConfig( world ) ).toBe( DEFAULT_SIM_CONFIG );
    } );

    it( 'a stale release does not drop a newer holder', () => {
        const world = createWorld();
        const releaseOld = holdRunConfig( world, { ...DEFAULT_SIM_CONFIG } );
        const newer = { ...DEFAULT_SIM_CONFIG };
        holdRunConfig( world, newer );
        releaseOld();
        expect( runConfig( world ) ).toBe( newer );
    } );
} );
