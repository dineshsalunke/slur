import { useFrame } from '@react-three/fiber';
import { HALF_WIDTH, SEG_LEN, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { Fragment, useRef } from 'react';
import type * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';
import { AHEAD, BACK, park, put } from './track-instancing';
import { FLOOR_SURFACE, RAIL_SURFACE } from './track-materials';

// Hard buffer sizes — exceeding them silently drops instances. Visible window is ~49 segments.
const FLOOR_LIMIT = 256;
const RAIL_LIMIT = 128;
const FLOOR_THICK = 0.6; // the span's `y` is the WALKABLE TOP; the slab hangs below it
const RAIL_W = 0.5;
const RAIL_H = 0.5; // stands proud of the floor so the rail reads at the shallow chase angle

/**
 * Floor quads and edge rails, driven imperatively from a Z-window around the local ship.
 *
 * Separate from the hazard blocks so `/art-lab` can show the rail without untextured boxes in the shot.
 * `showFloor` hides the quads rather than unmounting them — an early return would strand the rails too.
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
            // Floored segments only, so the rail breaks over gaps — a flat ribbon's gaps foreshorten to
            // nothing at the chase angle, and the break is what makes them read.
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
            { /* frustumCulled=false: three computes an InstancedMesh's bounding sphere once, so the stale
                 volume culls the whole track once the ship flies past it. These are always on-screen. */ }
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
                <meshStandardMaterial { ...RAIL_SURFACE } />
            </instancedMesh>
        </Fragment>
    );
}
