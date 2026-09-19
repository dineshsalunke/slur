// Instanced-pool plumbing for `TrackBlocks`, plus the render window the generated meshes are built to
// cover. Shared because that window must not drift: blocks would appear past the end of the deck. The
// scratch Object3D is module-scope because these run every frame and must not allocate.

import * as THREE from 'three';

// The render window, ahead of and behind the ship. AHEAD dominates because you race forward into it, and
// `TrackFloor` reuses it to build the run-out pad past the finish line.
export const AHEAD = 900;
export const BACK = 80;

const _m = new THREE.Object3D();
const _hidden = ( () => {
    // A parked transform for unused pool slots (scaled to nothing, shoved off-screen).
    _m.position.set( 0, -9999, 0 );
    _m.scale.set( 0, 0, 0 );
    _m.updateMatrix();
    return _m.matrix.clone();
} )();

/** Write one instance's transform and advance the slot counter (returns the next index). */
export function put(
    mesh: THREE.InstancedMesh,
    i: number,
    limit: number,
    cx: number,
    cy: number,
    cz: number,
    sx: number,
    sy: number,
    sz: number,
): number {
    if ( i >= limit ) return i;
    _m.position.set( cx, cy, cz );
    _m.scale.set( sx, sy, sz );
    _m.updateMatrix();
    mesh.setMatrixAt( i, _m.matrix );
    return i + 1;
}

/** Park pool slots [from, until) that were live last frame but aren't now (cheaper than clearing all). */
export function park( mesh: THREE.InstancedMesh, from: number, until: number ): void {
    for ( let k = from; k < until; k++ ) mesh.setMatrixAt( k, _hidden );
}
