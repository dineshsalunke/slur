import { useFrame } from '@react-three/fiber';
import { SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { Fragment, useRef } from 'react';
import type * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';
import { AHEAD, BACK, park, put } from './track-instancing';
import { DRAG_OPACITY_MAX, DRAG_OPACITY_MIN, DRAG_PULSE_SPEED, DRAG_SURFACE, LETHAL_SURFACE } from './track-materials';

// per-KIND pool cap (lethal + drag render as two meshes). Worst case is ~108 lethal / ~63 drag per window,
// asserted in track.test.ts — keep this above that with margin, because overflow drops instances silently.
const BLOCK_LIMIT = 160;

// Each box is sized from its OWN AABB, so what you see is exactly what the ship's footprint tests against.
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

/**
 * The hazard blocks — lethal walls and passable drag blocks — as their own mountable leaf.
 *
 * Split from the rails so `/art-lab` can judge the deck and rail without these untextured placeholder
 * boxes in the shot, while keeping them one click away for the hazard-to-floor contact check.
 */
export function TrackBlocks( { track }: { track: Track } ) {
    const world = useWorld();
    const lethalRef = useRef< THREE.InstancedMesh | null >( null );
    const dragRef = useRef< THREE.InstancedMesh | null >( null );
    const prevLethal = useRef( 0 );
    const prevDrag = useRef( 0 );

    useFrame( ( { clock } ) => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const lethal = lethalRef.current;
        const drag = dragRef.current;
        if ( ! sim || ! lethal || ! drag ) return;

        // Breathing the drag blocks' opacity is what makes them read passable rather than lethal. Cosmetic
        // only — outside the deterministic sim, so Math.sin is fine here.
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
        park( lethal, li, prevLethal.current );
        park( drag, di, prevDrag.current );
        prevLethal.current = li;
        prevDrag.current = di;
        lethal.instanceMatrix.needsUpdate = true;
        drag.instanceMatrix.needsUpdate = true;
    } );

    return (
        <Fragment>
            { /* frustumCulled=false for the same reason as the rails: three computes an InstancedMesh's
                 bounding sphere once, and a stale volume culls the lot once the ship flies past it. */ }
            <instancedMesh ref={ lethalRef } frustumCulled={ false } args={ [ undefined, undefined, BLOCK_LIMIT ] }>
                <boxGeometry />
                <meshStandardMaterial { ...LETHAL_SURFACE } />
            </instancedMesh>
            { /* Drag blocks are passable — fly through for a speed hit. depthWrite=false so they never
                 z-occlude like a solid; the generator never puts drag and lethal in one lane. */ }
            <instancedMesh ref={ dragRef } frustumCulled={ false } args={ [ undefined, undefined, BLOCK_LIMIT ] }>
                <boxGeometry />
                <meshStandardMaterial { ...DRAG_SURFACE } opacity={ DRAG_OPACITY_MAX } />
            </instancedMesh>
        </Fragment>
    );
}
