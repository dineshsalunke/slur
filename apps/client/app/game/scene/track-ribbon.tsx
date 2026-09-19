import { useFrame } from '@react-three/fiber';
import { HALF_WIDTH, SEG_LEN, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { Fragment, useRef } from 'react';
import type * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';
import { AHEAD, BACK, park, put } from './track-instancing';
import { FLOOR_SURFACE, RAIL_SURFACE } from './track-materials';

// Instance pool caps — hard buffer sizes (exceeding silently drops). The window is
// (AHEAD+BACK)/SEG_LEN ≈ 49 segments; floors ~1/seg → generous margin.
const FLOOR_LIMIT = 256;
const RAIL_LIMIT = 128; // 2 edge rails per floored segment × ~49 visible ≈ 98
const FLOOR_THICK = 0.6; // floor slab thickness; the span's `y` is the WALKABLE TOP, slab hangs below it
const RAIL_W = 0.5; // edge-rail cross-section (x). Rails frame the track AND, by their absence, make gaps read.
const RAIL_H = 0.5; // edge-rail cross-section (y), standing proud of the floor so it reads at the shallow chase angle

/**
 * The ribbon itself: floor quads and the edge rails, driven imperatively from a Z-window around the local
 * ship (no React state, no re-map per frame).
 *
 * SPLIT FROM THE HAZARD BLOCKS on purpose. They used to share one component, so `/art-lab` could not show
 * the rail — the subject of the whole track art pass — without also putting untextured boxes in the shot.
 *
 * `showFloor` suppresses ONLY the floor quads, so the generated `TrackFloor` can stand in without the two
 * stacking. The mesh stays mounted and keeps receiving matrices; only its visibility is off, which costs
 * nothing and avoids a null-ref early-return that would strand the rails too.
 */
export function TrackRibbon( { track, showFloor = true }: { track: Track; showFloor?: boolean } ) {
    const world = useWorld();
    const floorRef = useRef< THREE.InstancedMesh | null >( null );
    const railRef = useRef< THREE.InstancedMesh | null >( null );
    const prevFloor = useRef( 0 );
    const prevRail = useRef( 0 );

    useFrame( () => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const floors = floorRef.current;
        const rails = railRef.current;
        if ( ! sim || ! floors || ! rails ) return;

        const i0 = Math.max( 0, Math.floor( ( sim.z - BACK ) / SEG_LEN ) );
        const i1 = Math.floor( ( sim.z + AHEAD ) / SEG_LEN );

        let fi = 0;
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
        }
        park( floors, fi, prevFloor.current );
        park( rails, ri, prevRail.current );
        prevFloor.current = fi;
        prevRail.current = ri;
        floors.instanceMatrix.needsUpdate = true;
        rails.instanceMatrix.needsUpdate = true;
    } );

    return (
        <Fragment>
            { /* frustumCulled=false: we mutate instanceMatrix every frame but three only computes the
                 InstancedMesh bounding sphere ONCE — a stale volume culls the whole track once the ship
                 flies past it (~z=120), making the floor/rails vanish. These are always on-screen. */ }
            <instancedMesh
                ref={ floorRef }
                visible={ showFloor }
                frustumCulled={ false }
                args={ [ undefined, undefined, FLOOR_LIMIT ] }
            >
                <boxGeometry />
                <meshStandardMaterial { ...FLOOR_SURFACE } />
            </instancedMesh>
            <instancedMesh ref={ railRef } frustumCulled={ false } args={ [ undefined, undefined, RAIL_LIMIT ] }>
                <boxGeometry />
                { /* The bright edge-rail read standing proud of the dark floor — the track's energy lives
                     here, not on the slab. Retoned to marigold in this task's slice 3. */ }
                <meshStandardMaterial { ...RAIL_SURFACE } />
            </instancedMesh>
        </Fragment>
    );
}
