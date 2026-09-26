import * as THREE from 'three';
import { pickupBody } from '../pickup-body';
import type { PickupPart } from '../pickup-instances/pickup-instances';

export function buildPortalPickup(): PickupPart[] {
    return pickupBody(
        new THREE.TorusGeometry( 1, 0.3, 8, 24 ),
        new THREE.TorusGeometry( 0.62, 0.1, 6, 24 ),
        new THREE.SphereGeometry( 0.26, 12, 8 ),
    );
}
