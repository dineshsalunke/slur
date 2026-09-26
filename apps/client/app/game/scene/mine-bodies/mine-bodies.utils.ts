import * as THREE from 'three';
import { mineBodyMaterial } from '../mine-body-material';
import { MAX_MINES, mineBodyGeometry, mineCoreGeometry, mineDecalGeometry } from '../mine-look';
import { _o, MIN_SCALE } from './mine-bodies.constants';

export function glowMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial( {
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    } );
}

export function buildLook() {
    const bodyGeo = mineBodyGeometry();
    const open = new THREE.InstancedBufferAttribute( new Float32Array( MAX_MINES ).fill( 1 ), 1 );
    open.setUsage( THREE.DynamicDrawUsage );
    bodyGeo.setAttribute( 'aOpen', open );
    return {
        bodyGeo,
        coreGeo: mineCoreGeometry(),
        decalGeo: mineDecalGeometry(),
        body: mineBodyMaterial(),
        core: glowMaterial(),
        decal: glowMaterial(),
    };
}

export function phaseOf( x: number, z: number ): number {
    const h = Math.sin( x * 12.9898 + z * 78.233 ) * 43758.5453;
    return h - Math.floor( h );
}

export function place( mesh: THREE.InstancedMesh, i: number, sx: number, sy: number, sz: number ): void {
    _o.scale.set( Math.max( MIN_SCALE, sx ), Math.max( MIN_SCALE, sy ), Math.max( MIN_SCALE, sz ) );
    _o.updateMatrix();
    mesh.setMatrixAt( i, _o.matrix );
}
