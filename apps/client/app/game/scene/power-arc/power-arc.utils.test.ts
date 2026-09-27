import { HeldPower, POWER_SLOTS } from '@slur/shared';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GAP, LOOK, MIN_BACK, PITCH, SAG } from './power-arc.constants';
import { arcAnchor, easeOut, pulseScale, slotLook, slotPoint, takePickup } from './power-arc.utils';

const { none, bolt, seeker, mine } = HeldPower;

describe( 'power arc', () => {
    it( 'sits behind the tail by the hull half-length plus the gap', () => {
        const a = arcAnchor( new THREE.Vector3( 3, 2, 100 ), 0.5, 3, new THREE.Vector3() );
        expect( a.x ).toBe( 3 );
        expect( a.z ).toBe( 100 - 3 - GAP );
    } );

    it( 'keeps a short hull at the minimum distance back', () => {
        expect( arcAnchor( new THREE.Vector3( 0, 0, 100 ), 0, 0.59, new THREE.Vector3() ).z ).toBe( 100 - MIN_BACK );
    } );

    it( 'curves up from a low centre, slot 1 on screen left (+x)', () => {
        const anchor = new THREE.Vector3( 0, 0, 0 );
        const pts = Array.from( { length: POWER_SLOTS }, ( _, i ) => slotPoint( anchor, i, new THREE.Vector3() ) );
        expect( pts.map( ( p ) => p.x ) ).toEqual( [ PITCH, 0, -PITCH ] );
        expect( pts.map( ( p ) => p.y ) ).toEqual( [ SAG, 0, SAG ] );
    } );

    it( 'reports only the first empty-to-full slot and remembers the rack', () => {
        const prev = [ none, none, bolt ];
        expect( takePickup( prev, [ seeker, mine, bolt ] ) ).toBe( 0 );
        expect( prev ).toEqual( [ seeker, mine, bolt ] );
        expect( takePickup( prev, [ seeker, mine, bolt ] ) ).toBe( -1 );
        expect( takePickup( prev, [ none, mine, seeker ] ) ).toBe( -1 );
        expect( takePickup( prev, [ bolt, mine, seeker ] ) ).toBe( 0 );
    } );

    it( 'eases and pulses inside their bounds', () => {
        expect( easeOut( 0 ) ).toBe( 0 );
        expect( easeOut( 1 ) ).toBe( 1 );
        expect( easeOut( 2 ) ).toBe( 1 );
        expect( pulseScale( 1 ) ).toBe( 1 );
        expect( pulseScale( 0 ) ).toBeGreaterThan( 1 );
    } );

    it( 'lights the selected slot brightest and an empty slot faintest', () => {
        expect( slotLook( bolt, true ) ).toBe( LOOK.selected );
        expect( slotLook( bolt, false ) ).toBe( LOOK.held );
        expect( slotLook( none, false ) ).toBe( LOOK.empty );
        expect( LOOK.empty.alpha ).toBeLessThan( LOOK.held.alpha );
    } );
} );
