import { useFrame } from '@react-three/fiber';
import { HALF_WIDTH, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { Fragment, useRef } from 'react';
import * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';

// How far ahead / behind the ship we materialise segments. The track is generated on demand from the
// seed (segmentAt), so this is a pure render window — cull everything outside it (LOD-friendly for a
// long track). AHEAD dominates because you race forward into it.
const AHEAD = 900;
const BACK = 80;

// Instance pool caps — hard buffer sizes (exceeding silently drops). The window is
// (AHEAD+BACK)/SEG_LEN ≈ 49 segments; floors ~1/seg, blocks ~0.22/seg → these have generous margin.
const FLOOR_LIMIT = 256;
const BLOCK_LIMIT = 128;
const RAIL_LIMIT = 128; // 2 edge rails per floored segment × ~49 visible ≈ 98
const FLOOR_THICK = 0.6; // floor slab thickness; the span's `y` is the WALKABLE TOP, slab hangs below it
const RAIL_W = 0.5; // edge-rail cross-section (x). Rails frame the track AND, by their absence, make gaps read.
const RAIL_H = 0.5; // edge-rail cross-section (y), standing proud of the floor so it reads at the shallow chase angle

const _m = new THREE.Object3D(); // module-scope scratch — no per-frame allocation (r3f hot-path rule)
const _hidden = ( () => {
    // A parked transform for unused pool slots (scaled to nothing, shoved off-screen).
    _m.position.set( 0, -9999, 0 );
    _m.scale.set( 0, 0, 0 );
    _m.updateMatrix();
    return _m.matrix.clone();
} )();

// Write one instance's transform and advance the slot counter (returns the next index).
function put(
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

// Park pool slots [from, until) that were live last frame but aren't now (cheaper than clearing all).
function park( mesh: THREE.InstancedMesh, from: number, until: number ): void {
    for ( let k = from; k < until; k++ ) mesh.setMatrixAt( k, _hidden );
}

// Emit one segment's lethal cubes into the block pool; returns the next free slot index. Each cube is a
// DISCRETE box — sized from its OWN [x0,x1] × [y0,y1] × [z0,z1] (a 1×1-cell footprint, 2 cells tall), NOT
// the whole segment — so an open-scatter field reads as separate pillars you weave between. This box IS
// the collision AABB (WYSIWYG), so what you see is exactly what the ship's footprint tests against.
function emitBlocks( mesh: THREE.InstancedMesh, bi: number, seg: Segment ): number {
    for ( const b of seg.blocks ) {
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

// Instanced track floors + hazard blocks, driven fully imperatively from a Z-window around the local
// ship (NO React state, NO re-map per frame). Two draw calls total. Track is local-only (from the
// synced seed) — never reconciled tile-by-tile.
export function TrackView( { track }: { track: Track } ) {
    const world = useWorld();
    const floorRef = useRef< THREE.InstancedMesh | null >( null );
    const blockRef = useRef< THREE.InstancedMesh | null >( null );
    const railRef = useRef< THREE.InstancedMesh | null >( null );
    const prevFloor = useRef( 0 );
    const prevBlock = useRef( 0 );
    const prevRail = useRef( 0 );

    useFrame( () => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const floors = floorRef.current;
        const blocks = blockRef.current;
        const rails = railRef.current;
        if ( ! sim || ! floors || ! blocks || ! rails ) return;

        const i0 = Math.max( 0, Math.floor( ( sim.z - BACK ) / SEG_LEN ) );
        const i1 = Math.floor( ( sim.z + AHEAD ) / SEG_LEN );

        let fi = 0;
        let bi = 0;
        let ri = 0;
        for ( let i = i0; i <= i1; i++ ) {
            const seg = track.segmentAt( i );
            const cz = ( seg.z0 + seg.z1 ) / 2;
            const len = seg.z1 - seg.z0;
            // Edge rails on floored segments only → they break over gaps, making holes read at the
            // shallow chase angle (a flat ribbon's gaps foreshorten to nothing). Rail rides the floor
            // height, so it also outlines raised platforms.
            if ( seg.floors.length > 0 ) {
                const railY = seg.floors[ 0 ].y + RAIL_H / 2;
                ri = put( rails, ri, RAIL_LIMIT, -HALF_WIDTH, railY, cz, RAIL_W, RAIL_H, len );
                ri = put( rails, ri, RAIL_LIMIT, HALF_WIDTH, railY, cz, RAIL_W, RAIL_H, len );
            }
            for ( const f of seg.floors ) {
                fi = put(
                    floors,
                    fi,
                    FLOOR_LIMIT,
                    ( f.x0 + f.x1 ) / 2,
                    f.y - FLOOR_THICK / 2,
                    cz,
                    f.x1 - f.x0,
                    FLOOR_THICK,
                    len,
                );
            }
            bi = emitBlocks( blocks, bi, seg );
        }
        park( floors, fi, prevFloor.current );
        park( blocks, bi, prevBlock.current );
        park( rails, ri, prevRail.current );
        prevFloor.current = fi;
        prevBlock.current = bi;
        prevRail.current = ri;
        floors.instanceMatrix.needsUpdate = true;
        blocks.instanceMatrix.needsUpdate = true;
        rails.instanceMatrix.needsUpdate = true;
    } );

    return (
        <Fragment>
            { /* frustumCulled=false: we mutate instanceMatrix every frame but three only computes the
                 InstancedMesh bounding sphere ONCE — a stale volume culls the whole track once the ship
                 flies past it (~z=120), making the floor/rails/blocks vanish. These are always on-screen. */ }
            <instancedMesh ref={ floorRef } frustumCulled={ false } args={ [ undefined, undefined, FLOOR_LIMIT ] }>
                <boxGeometry />
                <meshStandardMaterial
                    emissive="#0aa5ff"
                    emissiveIntensity={ 1.5 }
                    color="#04121f"
                    toneMapped={ false }
                />
            </instancedMesh>
            <instancedMesh ref={ blockRef } frustumCulled={ false } args={ [ undefined, undefined, BLOCK_LIMIT ] }>
                <boxGeometry />
                <meshStandardMaterial
                    emissive="#ff2740"
                    emissiveIntensity={ 2.2 }
                    color="#1a0206"
                    toneMapped={ false }
                />
            </instancedMesh>
            <instancedMesh ref={ railRef } frustumCulled={ false } args={ [ undefined, undefined, RAIL_LIMIT ] }>
                <boxGeometry />
                <meshStandardMaterial
                    emissive="#39ffe6"
                    emissiveIntensity={ 2.6 }
                    color="#062b28"
                    toneMapped={ false }
                />
            </instancedMesh>
        </Fragment>
    );
}
