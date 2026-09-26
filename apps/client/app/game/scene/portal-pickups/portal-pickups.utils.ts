import * as THREE from 'three';
import { accent } from '../accent';
import { PICKUP_GLYPH_INTENSITY } from '../combat-look';
import type { PickupPart } from '../pickup-instances/pickup-instances';
import { dashedSleeveGeometry, mergeParts, ringGeometry } from '../portal-ring';
import { graphiteSurface } from '../track-materials';
import { PICKUP_DASH, PICKUP_LINK, PICKUP_RING, PICKUP_SLEEVE, PICKUP_TILT } from './portal-pickups.constants';

function linkedPair( ring: () => THREE.BufferGeometry ): THREE.BufferGeometry {
    const a = ring().translate( -PICKUP_LINK, 0, 0 );
    const b = ring()
        .rotateX( Math.PI / 2 )
        .translate( PICKUP_LINK, 0, 0 );
    return mergeParts( [ a, b ] ).rotateZ( PICKUP_TILT );
}

export function buildPortalPickup(): PickupPart[] {
    const band = new THREE.MeshStandardMaterial( { color: '#000000', emissiveIntensity: PICKUP_GLYPH_INTENSITY } );
    band.emissive = accent();
    return [
        {
            geometry: linkedPair( () => ringGeometry( PICKUP_RING ) ),
            material: new THREE.MeshStandardMaterial( graphiteSurface() ),
        },
        {
            geometry: linkedPair( () => dashedSleeveGeometry( PICKUP_RING, PICKUP_SLEEVE, PICKUP_DASH ) ),
            material: band,
        },
    ];
}
