import { useFrame } from '@react-three/fiber';
import { SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { Fragment, useRef } from 'react';
import type * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';
import { AHEAD, BACK, put } from './track-instancing';
import { DRAG_OPACITY_MAX, DRAG_OPACITY_MIN, DRAG_PULSE_SPEED, DRAG_SURFACE, LETHAL_SURFACE } from './track-materials';

const BLOCK_LIMIT = 160;

function emitBlocks( mesh: THREE.InstancedMesh, bi: number, seg: Segment, lethal: boolean ): number {
    for ( const b of seg.blocks ) {
        if ( b.lethal !== lethal ) continue;
        const h = Math.max( 0.05, b.y1 - b.y0 );
        bi = put(
            mesh,
            bi,
            BLOCK_LIMIT,
            ( b.x0 + b.x1 ) / 2,
            b.y0 + h / 2,
            ( b.z0 + b.z1 ) / 2,
            b.x1 - b.x0,
            h,
            b.z1 - b.z0,
        );
    }
    return bi;
}

export function TrackBlocks( { track }: { track: Track } ) {
    const world = useWorld();
    const lethalRef = useRef< THREE.InstancedMesh | null >( null );
    const dragRef = useRef< THREE.InstancedMesh | null >( null );

    useFrame( ( { clock } ) => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const lethal = lethalRef.current;
        const drag = dragRef.current;
        if ( ! sim || ! lethal || ! drag ) return;

        ( drag.material as THREE.MeshStandardMaterial ).opacity =
            DRAG_OPACITY_MIN +
            ( DRAG_OPACITY_MAX - DRAG_OPACITY_MIN ) * 0.5 * ( 1 + Math.sin( clock.elapsedTime * DRAG_PULSE_SPEED ) );

        const i0 = Math.max( 0, Math.floor( ( sim.z - BACK ) / SEG_LEN ) );
        const i1 = Math.floor( ( sim.z + AHEAD ) / SEG_LEN );

        let li = 0;
        let di = 0;
        for ( let i = i0; i <= i1; i++ ) {
            const seg = track.segmentAt( i );
            li = emitBlocks( lethal, li, seg, true );
            di = emitBlocks( drag, di, seg, false );
        }
        lethal.count = li;
        drag.count = di;
        lethal.instanceMatrix.needsUpdate = true;
        drag.instanceMatrix.needsUpdate = true;
    } );

    return (
        <Fragment>
            <instancedMesh
                ref={ lethalRef }
                count={ 0 }
                frustumCulled={ false }
                args={ [ undefined, undefined, BLOCK_LIMIT ] }
            >
                <boxGeometry />
                <meshStandardMaterial { ...LETHAL_SURFACE } />
            </instancedMesh>
            <instancedMesh
                ref={ dragRef }
                count={ 0 }
                frustumCulled={ false }
                args={ [ undefined, undefined, BLOCK_LIMIT ] }
            >
                <boxGeometry />
                <meshStandardMaterial { ...DRAG_SURFACE } opacity={ DRAG_OPACITY_MAX } />
            </instancedMesh>
        </Fragment>
    );
}
