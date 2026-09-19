import { useFrame } from '@react-three/fiber';
import { HALF_WIDTH, SEG_LEN, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useRef } from 'react';
import type * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';
import { AHEAD, BACK, park, put } from './track-instancing';
import { RAIL_SURFACE } from './track-materials';

// Hard buffer size — exceeding it silently drops instances. The window is ~49 segments, two rails each.
const RAIL_LIMIT = 128;
const RAIL_W = 0.5;
const RAIL_H = 0.5; // stands proud of the floor so the rail reads at the shallow chase angle

/**
 * The two edge rails, driven imperatively from a Z-window around the local ship.
 *
 * Instanced while the floor is one baked mesh: a rail is a uniform box with no gap geometry to express,
 * so a streamed window costs less than 8000u of it in a buffer.
 */
export function TrackRails( { track }: { track: Track } ) {
    const world = useWorld();
    const railRef = useRef< THREE.InstancedMesh | null >( null );
    const prevRail = useRef( 0 );

    useFrame( () => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const rails = railRef.current;
        if ( ! sim || ! rails ) return;

        const i0 = Math.max( 0, Math.floor( ( sim.z - BACK ) / SEG_LEN ) );
        const i1 = Math.floor( ( sim.z + AHEAD ) / SEG_LEN );

        let ri = 0;
        for ( let i = i0; i <= i1; i++ ) {
            const seg = track.segmentAt( i );
            // Floored segments only, so the rail breaks over gaps — a flat ribbon's gaps foreshorten to
            // nothing at the chase angle, and the break is what makes them read.
            if ( seg.floors.length === 0 ) continue;
            const cz = ( seg.z0 + seg.z1 ) / 2;
            const len = seg.z1 - seg.z0;
            const railY = seg.floors[ 0 ].y + RAIL_H / 2;
            ri = put( rails, ri, RAIL_LIMIT, -HALF_WIDTH, railY, cz, RAIL_W, RAIL_H, len );
            ri = put( rails, ri, RAIL_LIMIT, HALF_WIDTH, railY, cz, RAIL_W, RAIL_H, len );
        }
        park( rails, ri, prevRail.current );
        prevRail.current = ri;
        rails.instanceMatrix.needsUpdate = true;
    } );

    // frustumCulled=false: three computes an InstancedMesh's bounding sphere once, so the stale volume
    // culls the whole track once the ship flies past it. These are always on-screen.
    return (
        <instancedMesh ref={ railRef } frustumCulled={ false } args={ [ undefined, undefined, RAIL_LIMIT ] }>
            <boxGeometry />
            <meshStandardMaterial { ...RAIL_SURFACE } />
        </instancedMesh>
    );
}
