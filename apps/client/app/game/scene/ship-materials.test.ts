import { MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { ENGINE_MATERIAL, type EngineGlow, engineIntensity, engineMaterial } from './ship-materials';

const G: EngineGlow = { idle: 1, cruise: 2.2 };

describe( 'engineIntensity', () => {
    it( 'sits at idle when stopped and at cruise at full speed', () => {
        expect( engineIntensity( G, 0 ) ).toBeCloseTo( G.idle, 6 );
        expect( engineIntensity( G, 1 ) ).toBeCloseTo( G.cruise, 6 );
    } );

    it( 'interpolates between the two', () => {
        expect( engineIntensity( G, 0.5 ) ).toBeCloseTo( 1.6, 6 );
    } );

    it( 'clamps out-of-range speed rather than extrapolating', () => {
        expect( engineIntensity( G, -3 ) ).toBeCloseTo( G.idle, 6 );
        expect( engineIntensity( G, 9 ) ).toBeCloseTo( G.cruise, 6 );
    } );

    it( 'holds a constant glow when idle and cruise are dialled together', () => {
        const flat = { idle: 1.4, cruise: 1.4 };
        expect( engineIntensity( flat, 0 ) ).toBeCloseTo( 1.4, 6 );
        expect( engineIntensity( flat, 1 ) ).toBeCloseTo( 1.4, 6 );
    } );
} );

describe( 'engineMaterial', () => {
    it( 'picks the engine core by its authored name', () => {
        const mat = new MeshStandardMaterial( { name: ENGINE_MATERIAL } );
        expect( engineMaterial( mat ) ).toBe( mat );
    } );

    it( 'skips every other standard material', () => {
        expect( engineMaterial( new MeshStandardMaterial( { name: 'Marigold_emission' } ) ) ).toBeNull();
    } );

    it( 'skips a non-standard material even when it carries the name', () => {
        expect( engineMaterial( new MeshBasicMaterial( { name: ENGINE_MATERIAL } ) ) ).toBeNull();
    } );
} );
