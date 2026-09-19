import { useFrame } from '@react-three/fiber';
import { SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { Fragment, useRef } from 'react';
import type * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';
import { AHEAD, BACK, park, put } from './track-instancing';
import { DRAG_OPACITY_MAX, DRAG_OPACITY_MIN, DRAG_PULSE_SPEED, DRAG_SURFACE, LETHAL_SURFACE } from './track-materials';

// per-KIND pool cap (lethal + drag render as two meshes). Worst-case ~108 lethal / ~63 drag per window
// (asserted in track.test.ts) — keep this ≥ that with margin.
const BLOCK_LIMIT = 160;

// Emit one segment's blocks into the pool matching `lethal` (red walls vs amber drag) — the OTHER kind's
// blocks are skipped, so each mesh only draws its own colour. Returns the next free slot index. Each box is a
// DISCRETE AABB — sized from its OWN [x0,x1] × [y0,y1] × [z0,z1] — so what you see is exactly what the ship's
// footprint tests against (WYSIWYG). Drag (amber) blocks are PASSABLE: you can fly through them for a speed hit.
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
 * SPLIT FROM THE RIBBON on purpose: these are untextured boxes awaiting their own design task, and while
 * they shared a component with the edge rails, `/art-lab` could not judge the rail or the floor without
 * looking past them. They stay one click away because "hazard-to-floor contact shading" is a real check.
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

        // Breathe the drag blocks' opacity 0.25↔0.5 (one shared material → every drag instance at once) so
        // they read as passable energy, never as the solid lethal walls. Cosmetic-only: not the
        // deterministic sim, so Math.sin is fine, and no React re-render (non-negotiable #4).
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
            { /* frustumCulled=false for the same reason as the ribbon: three computes an InstancedMesh's
                 bounding sphere once, and a stale volume culls the lot once the ship flies past it. */ }
            { /* Lethal walls — the lone RED accent (touch → derezz). Kept saturated so danger reads instantly
                 against the gray track. */ }
            <instancedMesh ref={ lethalRef } frustumCulled={ false } args={ [ undefined, undefined, BLOCK_LIMIT ] }>
                <boxGeometry />
                <meshStandardMaterial { ...LETHAL_SURFACE } />
            </instancedMesh>
            { /* Drag blocks — AMBER, visibly distinct from the red walls so you read "slow, not death" at a
                 glance. Passable: fly through for a speed hit, or strafe around. Dimmer than the red so lethal
                 stays the louder warning. depthWrite=false → blends softly and never z-occludes like a solid;
                 drag and lethal never share a lane (generator), so no cross-occlusion. */ }
            <instancedMesh ref={ dragRef } frustumCulled={ false } args={ [ undefined, undefined, BLOCK_LIMIT ] }>
                <boxGeometry />
                <meshStandardMaterial { ...DRAG_SURFACE } opacity={ DRAG_OPACITY_MAX } />
            </instancedMesh>
        </Fragment>
    );
}
