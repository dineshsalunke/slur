import { DEFAULT_SIM_CONFIG } from '@slur/shared';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
    MINE_ARMED_GLOW,
    MINE_ARMING_GLOW,
    MINE_PULSE_DEPTH,
    mineBodyGeometry,
    mineCoreGeometry,
    mineDecalGeometry,
    mineGlow,
    minePickupCoreGeometry,
    minePickupShellGeometry,
    mineReach,
} from './mine-look';

function bounds( g: THREE.BufferGeometry ): THREE.Box3 {
    g.computeBoundingBox();
    return g.boundingBox ?? new THREE.Box3();
}

describe( 'mine pickup', () => {
    it( 'is a star of spikes about as tall as the bolt pickup, centred on its anchor', () => {
        const g = minePickupShellGeometry();
        const s = bounds( g );
        const pos = g.getAttribute( 'position' );
        let far = 0;
        for ( let i = 0; i < pos.count; i++ )
            far = Math.max( far, new THREE.Vector3().fromBufferAttribute( pos, i ).length() );
        expect( far ).toBeCloseTo( mineReach(), 2 );
        expect( s.max.y + s.min.y ).toBeCloseTo( 0, 1 );
        expect( s.max.x + s.min.x ).toBeCloseTo( 0, 1 );
        expect( mineReach() ).toBeGreaterThan( 1 );
        expect( mineReach() ).toBeLessThan( 1.4 );
    } );

    it( 'shows its hot core between the spike roots', () => {
        const c = bounds( minePickupCoreGeometry() );
        expect( c.max.x ).toBeGreaterThan( 0.3 );
    } );
} );

describe( 'deployed mine', () => {
    it( 'sits on the deck inside the sim box a bolt must meet', () => {
        const cfg = DEFAULT_SIM_CONFIG;
        for ( const g of [ mineBodyGeometry(), mineCoreGeometry() ] ) {
            const b = bounds( g );
            expect( b.min.y ).toBeGreaterThan( -1e-6 );
            expect( b.max.y ).toBeLessThanOrEqual( cfg.mineHeight );
            for ( const v of [ b.max.x, -b.min.x, b.max.z, -b.min.z ] ) expect( v ).toBeLessThanOrEqual( cfg.mineHalf );
        }
    } );

    it( 'paints its trigger ring on the deck at the trigger radius', () => {
        const b = bounds( mineDecalGeometry() );
        expect( b.max.x ).toBeCloseTo( DEFAULT_SIM_CONFIG.mineTriggerR, 1 );
        expect( b.max.y - b.min.y ).toBeLessThan( 0.01 );
        expect( b.min.y ).toBeGreaterThan( 0 );
    } );
} );

describe( 'mineGlow', () => {
    it( 'holds dim while arming and pulses once armed', () => {
        expect( mineGlow( false, 0.3, 0 ) ).toBe( MINE_ARMING_GLOW );
        const samples = Array.from( { length: 40 }, ( _, i ) => mineGlow( true, i / 40, 0 ) );
        expect( Math.max( ...samples ) ).toBeCloseTo( MINE_ARMED_GLOW, 2 );
        expect( Math.min( ...samples ) ).toBeCloseTo( MINE_ARMED_GLOW - MINE_PULSE_DEPTH, 1 );
        expect( Math.min( ...samples ) ).toBeGreaterThan( MINE_ARMING_GLOW );
    } );
} );
