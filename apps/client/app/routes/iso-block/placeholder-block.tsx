import { PLACEHOLDER_BLOCK } from './block-dimensions';

/**
 * PLACEHOLDER ONLY — one untextured box at a legal block size.
 *
 * This is NOT the block design. It proves the `/iso-block` instrument end to end while the silhouette family
 * and material await approval. Whoever lands that design should DELETE this file rather than evolve it.
 *
 * The material is deliberately the R3F default. It does NOT import `LETHAL_SURFACE` from
 * `track-materials.ts`: that surface is the shipped TRON retone whose `#ff2740` is the red the frozen palette
 * excludes, and its `toneMapped: false` is what task 2's D3 removes. A neutral box reads as "undesigned";
 * the shipped red would read as a decision nobody took.
 *
 * Sits ON the ground plane (y = height/2) — how a block meets the floor is part of the read.
 */
export function PlaceholderBlock() {
    const { width, height, depth } = PLACEHOLDER_BLOCK;

    return (
        <mesh position={ [ 0, height / 2, 0 ] }>
            <boxGeometry args={ [ width, height, depth ] } />
            <meshStandardMaterial color="#6b7280" roughness={ 0.7 } metalness={ 0 } />
        </mesh>
    );
}
