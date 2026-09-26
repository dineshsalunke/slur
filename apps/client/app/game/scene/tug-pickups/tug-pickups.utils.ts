import * as THREE from 'three';
import { pickupBody } from '../pickup-body';
import type { PickupPart } from '../pickup-instances/pickup-instances';

export function buildTugPickup(): PickupPart[] {
    return pickupBody(
        new THREE.BoxGeometry( 0.9, 0.9, 2.4 ),
        new THREE.TorusGeometry( 0.72, 0.1, 6, 20, Math.PI ).rotateZ( Math.PI ).translate( 0, 0, 1.2 ),
        new THREE.SphereGeometry( 0.26, 12, 8 ).translate( 0, 0, -1.2 ),
    );
}
