import { BLOCK_HEIGHT } from '@slur/shared';
import { useMemo } from 'react';
import { sealedBlockGeometry } from './sealed-block-geometry';
import { SEALED_BLOCK_SURFACE } from './sealed-block-material';

export interface SealedBlockProps {
    w: number;
    d: number;
    x?: number;
    z?: number;
}

/** One sealed deadly block, standing on the deck at y=0. Height is never a prop: it is 8u, always. */
export function SealedBlock( { w, d, x = 0, z = 0 }: SealedBlockProps ) {
    const geometry = useMemo( () => sealedBlockGeometry( { w, h: BLOCK_HEIGHT, d } ), [ w, d ] );

    return (
        <mesh geometry={ geometry } position={ [ x, BLOCK_HEIGHT / 2, z ] }>
            <meshStandardMaterial { ...SEALED_BLOCK_SURFACE } />
        </mesh>
    );
}
