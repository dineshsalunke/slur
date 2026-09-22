import { MeshStandardMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { applyShipSurface, engineIntensity, type ShipMaterialTuning } from './ship-materials';

const T: ShipMaterialTuning = {
    engineIdle: 1.8,
    engineCruise: 3.2,
    accent: 1.2,
    hullRoughness: 1,
    hullEnvMap: 1.2,
};

describe( 'engineIntensity', () => {
    it( 'sits at idle when stopped and at cruise at full speed', () => {
        expect( engineIntensity( T, 0 ) ).toBeCloseTo( T.engineIdle, 6 );
        expect( engineIntensity( T, 1 ) ).toBeCloseTo( T.engineCruise, 6 );
    } );

    it( 'interpolates between the two', () => {
        expect( engineIntensity( T, 0.5 ) ).toBeCloseTo( 2.5, 6 );
    } );

    it( 'clamps out-of-range speed rather than extrapolating', () => {
        expect( engineIntensity( T, -3 ) ).toBeCloseTo( T.engineIdle, 6 );
        expect( engineIntensity( T, 9 ) ).toBeCloseTo( T.engineCruise, 6 );
    } );

    it( 'holds a constant glow when idle and cruise are dialled together', () => {
        const flat = { ...T, engineCruise: T.engineIdle };
        expect( engineIntensity( flat, 0 ) ).toBeCloseTo( T.engineIdle, 6 );
        expect( engineIntensity( flat, 1 ) ).toBeCloseTo( T.engineIdle, 6 );
    } );
} );

describe( 'applyShipSurface', () => {
    it( 'preserves the authored roughness at scale 1', () => {
        const mat = new MeshStandardMaterial( { roughness: 0.48 } );
        applyShipSurface( mat, T );
        expect( mat.roughness ).toBeCloseTo( 0.48, 6 );
        expect( mat.envMapIntensity ).toBeCloseTo( 1.2, 6 );
    } );

    it( 'scales relative to the authored value so materials keep their separation', () => {
        const charcoal = new MeshStandardMaterial( { roughness: 0.48 } );
        const armour = new MeshStandardMaterial( { roughness: 0.43 } );
        const t = { ...T, hullRoughness: 0.5 };
        applyShipSurface( charcoal, t );
        applyShipSurface( armour, t );
        expect( charcoal.roughness ).toBeCloseTo( 0.24, 6 );
        expect( armour.roughness ).toBeCloseTo( 0.215, 6 );
        expect( charcoal.roughness ).toBeGreaterThan( armour.roughness );
    } );

    it( 'remembers the authored roughness across repeated application', () => {
        const mat = new MeshStandardMaterial( { roughness: 0.48 } );
        applyShipSurface( mat, { ...T, hullRoughness: 0.5 } );
        applyShipSurface( mat, { ...T, hullRoughness: 0.5 } );
        applyShipSurface( mat, { ...T, hullRoughness: 1 } );
        expect( mat.roughness ).toBeCloseTo( 0.48, 6 );
    } );

    it( 'clamps into the legal roughness range', () => {
        const mat = new MeshStandardMaterial( { roughness: 0.48 } );
        applyShipSurface( mat, { ...T, hullRoughness: 0 } );
        expect( mat.roughness ).toBeCloseTo( 0.02, 6 );
        applyShipSurface( mat, { ...T, hullRoughness: 50 } );
        expect( mat.roughness ).toBeCloseTo( 1, 6 );
    } );
} );
