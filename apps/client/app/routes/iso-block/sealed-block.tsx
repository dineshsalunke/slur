import { useCallback } from 'react';
import * as THREE from 'three';
import { BLOCK_FAMILY, BLOCK_HEIGHT } from './block-dimensions';
import { createSealedBlockMaterial } from './sealed-block-material';

/**
 * The sealed deadly block family, rendered through the SAME path the game uses: one `InstancedMesh` over a
 * UNIT box, each instance carrying its footprint as a non-uniform scale. Judging any other arrangement would
 * be judging something the player never sees — the stretch that the material has to survive only exists on
 * this path.
 *
 * The geometry is `<boxGeometry />` with no arguments on purpose. It must stay the unit box: the material
 * reads each instance's real extent off the instance matrix and multiplies the unit position by it, so a
 * pre-sized geometry would double the scale and silently mis-size every world-unit feature.
 */

// Module scope, not `useMemo`: a compiled material is a GPU resource with a lifetime longer than a render,
// and at module scope it also survives HMR instead of recompiling on every edit.
const SEALED_BLOCK_MATERIAL = createSealedBlockMaterial();

const _placement = new THREE.Object3D();

export function SealedBlockFamily() {
    // A ref callback, not an effect: the matrices are static, so this is one-shot imperative setup at mount
    // and there is no external system to synchronise with.
    const place = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        if ( ! mesh ) return;

        BLOCK_FAMILY.blocks.forEach( ( block, i ) => {
            // y = height/2 puts the box ON the ground plane — how a block meets the floor is part of the read.
            _placement.position.set( block.x, BLOCK_HEIGHT / 2, 0 );
            _placement.scale.set( block.width, BLOCK_HEIGHT, block.depth );
            _placement.updateMatrix();
            mesh.setMatrixAt( i, _placement.matrix );
        } );

        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
    }, [] );

    return (
        <instancedMesh
            ref={ place }
            args={ [ undefined, undefined, BLOCK_FAMILY.blocks.length ] }
            material={ SEALED_BLOCK_MATERIAL }
        >
            <boxGeometry />
        </instancedMesh>
    );
}
