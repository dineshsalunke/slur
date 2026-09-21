import * as THREE from 'three';

export const AHEAD = 900;
export const BACK = 80;

const _m = new THREE.Object3D();
const _hidden = ( () => {
    _m.position.set( 0, -9999, 0 );
    _m.scale.set( 0, 0, 0 );
    _m.updateMatrix();
    return _m.matrix.clone();
} )();

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

export function park( mesh: THREE.InstancedMesh, from: number, until: number ): void {
    for ( let k = from; k < until; k++ ) mesh.setMatrixAt( k, _hidden );
}
