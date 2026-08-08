import { useFrame } from '@react-three/fiber';
import { SEG_LEN, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useRef } from 'react';
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
const FLOOR_THICK = 0.6; // floor slab thickness; the span's `y` is the WALKABLE TOP, slab hangs below it

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

// Instanced track floors + hazard blocks, driven fully imperatively from a Z-window around the local
// ship (NO React state, NO re-map per frame). Two draw calls total. Track is local-only (from the
// synced seed) — never reconciled tile-by-tile.
export function TrackView( { track }: { track: Track } ) {
    const world = useWorld();
    const floorRef = useRef< THREE.InstancedMesh | null >( null );
    const blockRef = useRef< THREE.InstancedMesh | null >( null );
    const prevFloor = useRef( 0 );
    const prevBlock = useRef( 0 );

    useFrame( () => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const floors = floorRef.current;
        const blocks = blockRef.current;
        if ( ! sim || ! floors || ! blocks ) return;

        const i0 = Math.max( 0, Math.floor( ( sim.z - BACK ) / SEG_LEN ) );
        const i1 = Math.floor( ( sim.z + AHEAD ) / SEG_LEN );

        let fi = 0;
        let bi = 0;
        for ( let i = i0; i <= i1; i++ ) {
            const seg = track.segmentAt( i );
            const cz = ( seg.z0 + seg.z1 ) / 2;
            const len = seg.z1 - seg.z0;
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
            for ( const b of seg.blocks ) {
                bi = put(
                    blocks,
                    bi,
                    BLOCK_LIMIT,
                    ( b.x0 + b.x1 ) / 2,
                    ( b.y0 + b.y1 ) / 2,
                    cz,
                    b.x1 - b.x0,
                    b.y1 - b.y0,
                    len,
                );
            }
        }
        park( floors, fi, prevFloor.current );
        park( blocks, bi, prevBlock.current );
        prevFloor.current = fi;
        prevBlock.current = bi;
        floors.instanceMatrix.needsUpdate = true;
        blocks.instanceMatrix.needsUpdate = true;
    } );

    return (
        <>
            <instancedMesh ref={ floorRef } args={ [ undefined, undefined, FLOOR_LIMIT ] }>
                <boxGeometry />
                <meshStandardMaterial
                    emissive="#0aa5ff"
                    emissiveIntensity={ 1.5 }
                    color="#04121f"
                    toneMapped={ false }
                />
            </instancedMesh>
            <instancedMesh ref={ blockRef } args={ [ undefined, undefined, BLOCK_LIMIT ] }>
                <boxGeometry />
                <meshStandardMaterial
                    emissive="#ff2740"
                    emissiveIntensity={ 2.2 }
                    color="#1a0206"
                    toneMapped={ false }
                />
            </instancedMesh>
        </>
    );
}
