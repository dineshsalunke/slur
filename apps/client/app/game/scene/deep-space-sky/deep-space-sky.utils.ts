import type * as THREE from 'three';
import { STARS_RENDER_ORDER } from './deep-space-sky.constants';

export function behindEverything( points: THREE.Points | null ): void {
    if ( ! points ) return;
    points.renderOrder = STARS_RENDER_ORDER;
    const material = points.material as THREE.Material;
    material.transparent = false;
    material.depthTest = false;
}
