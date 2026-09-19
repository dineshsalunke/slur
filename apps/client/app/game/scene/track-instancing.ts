// Shared instanced-pool plumbing for the track's leaf views (`TrackRails`, `TrackBlocks`).
//
// Shared rather than duplicated so the two cannot drift: a differing render window would show blocks
// appearing past the end of the rails. The scratch Object3D is module-scope because these run every frame
// and must not allocate.

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
