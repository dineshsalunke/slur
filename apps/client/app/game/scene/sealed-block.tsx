import { BLOCK_HEIGHT } from '@slur/shared';
import { useMemo } from 'react';
import { sealedBlockGeometry } from './sealed-block-geometry';
import { SEALED_BLOCK_SURFACE } from './sealed-block-material';
import { patchSealedBlock, sealedBlockUniforms } from './sealed-block-shader';
import { sealedBlockSeed } from './sealed-block-variation';

export interface SealedBlockProps {
    w: number;
    d: number;
    x?: number;
    z?: number;
    seed?: number;
    seamCount?: number;
    wearStrength?: number;
}

/** One sealed deadly block, standing on the deck at y=0. Height is never a prop: it is 8u, always. */
export function SealedBlock( { w, d, x = 0, z = 0, seed, seamCount, wearStrength }: SealedBlockProps ) {
    const dims = useMemo( () => ( { w, h: BLOCK_HEIGHT, d } ), [ w, d ] );
    const geometry = useMemo( () => sealedBlockGeometry( dims ), [ dims ] );
    const uniforms = useMemo(
        () =>
            sealedBlockUniforms( dims, {
                seed: seed ?? sealedBlockSeed( x, z ),
                seamCount,
                wear: wearStrength === undefined ? undefined : { strength: wearStrength },
            } ),
        [ dims, x, z, seed, seamCount, wearStrength ],
    );

    return (
        <mesh geometry={ geometry } position={ [ x, BLOCK_HEIGHT / 2, z ] }>
            <meshStandardMaterial { ...SEALED_BLOCK_SURFACE } ref={ ( m ) => m && patchSealedBlock( m, uniforms ) } />
        </mesh>
    );
}
