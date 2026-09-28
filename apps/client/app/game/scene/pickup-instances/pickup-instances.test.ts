import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { buildBoltBody } from '../bolt-pickups/bolt-pickups.utils';
import { buildBoostPickup } from '../boost-pickups/boost-pickups.utils';
import { PICKUP_BOB, PICKUP_HOVER, PICKUP_SIZE } from '../combat-look';
import { buildMinePickup } from '../mine-pickups/mine-pickups.utils';
import { buildPortalPickup } from '../portal-pickups/portal-pickups.utils';
import { buildSeekerPickup } from '../seeker-pickups/seeker-pickups.utils';
import { buildShieldPickup } from '../shield-pickups/shield-pickups.utils';
import { buildTugPickup } from '../tug-pickups/tug-pickups.utils';
import type { PickupPart } from './pickup-instances';
import { fitPickup } from './pickup-instances.utils';

vi.mock( '../track-materials', () => ( {
    graphiteSurface: () => ( {} ),
    graphiteShellMaterial: () => new THREE.MeshStandardMaterial(),
} ) );

const BUILDERS: Record< string, () => PickupPart[] > = {
    bolt: buildBoltBody,
    seeker: buildSeekerPickup,
    mine: buildMinePickup,
    boost: buildBoostPickup,
    shield: buildShieldPickup,
    portal: buildPortalPickup,
    tug: buildTugPickup,
};

function boundsOf( parts: PickupPart[] ): THREE.Box3 {
    const box = new THREE.Box3();
    for ( const p of parts ) {
        p.geometry.computeBoundingBox();
        if ( p.geometry.boundingBox ) box.union( p.geometry.boundingBox );
    }
    return box;
}

describe( 'fitPickup', () => {
    for ( const [ kind, build ] of Object.entries( BUILDERS ) ) {
        it( `${ kind }: longest side is PICKUP_SIZE`, () => {
            const size = boundsOf( fitPickup( build(), PICKUP_SIZE ) ).getSize( new THREE.Vector3() );
            expect( Math.max( size.x, size.y, size.z ) ).toBeCloseTo( PICKUP_SIZE, 2 );
        } );

        it( `${ kind }: bottom clears the deck at the low point of the bob`, () => {
            const box = boundsOf( fitPickup( build(), PICKUP_SIZE ) );
            expect( PICKUP_HOVER - PICKUP_BOB + box.min.y ).toBeGreaterThan( 0.25 );
        } );
    }

    it( 'scales a geometry shared by two parts once', () => {
        const g = new THREE.BoxGeometry( 1, 2, 1 );
        const m = new THREE.MeshBasicMaterial();
        const size = boundsOf(
            fitPickup(
                [
                    { geometry: g, material: m },
                    { geometry: g, material: m },
                ],
                5,
            ),
        ).getSize( new THREE.Vector3() );
        expect( size.y ).toBeCloseTo( 5, 5 );
    } );
} );
