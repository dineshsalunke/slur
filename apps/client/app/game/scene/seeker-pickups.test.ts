import { HeldPower, pickupPower, pickupsOf, procgenDescriptor, resolveTrack } from '@slur/shared';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { seekerCanisterCoreGeometry, seekerCanisterShellGeometry } from './seeker-look';
import { splitPickupLayout } from './seeker-pickups';

describe( 'splitPickupLayout', () => {
    it( 'puts every pickup in exactly one field, by its shared power', () => {
        const layout = pickupsOf( resolveTrack( procgenDescriptor( 7 ) ) );
        const { bolts, seekers } = splitPickupLayout( layout );

        expect( bolts.length + seekers.length ).toBe( layout.length );
        expect( seekers.length ).toBeGreaterThan( 0 );
        for ( const a of seekers ) expect( pickupPower( a.id ) ).toBe( HeldPower.seeker );
        for ( const a of bolts ) expect( pickupPower( a.id ) ).toBe( HeldPower.bolt );
    } );
} );

describe( 'seeker canister', () => {
    it( 'lies nose-forward along z with its hot core at the rear', () => {
        const shell = seekerCanisterShellGeometry();
        const core = seekerCanisterCoreGeometry();
        shell.computeBoundingBox();
        core.computeBoundingBox();
        const s = shell.boundingBox ?? new THREE.Box3();
        const c = core.boundingBox ?? new THREE.Box3();

        expect( s.max.z - s.min.z ).toBeGreaterThan( s.max.x - s.min.x );
        expect( c.max.z ).toBeLessThan( s.min.z + 0.2 );
        expect( c.min.z ).toBeGreaterThan( s.min.z );
    } );
} );
