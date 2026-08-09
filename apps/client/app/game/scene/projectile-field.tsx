import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RENDER_DELAY_MS } from '../ecs/net-systems';
import { NetProjectile, ProjInterp, type ProjSnapshot } from '../ecs/traits';

// Buffer size of the ONE instanced bolt mesh. `count` (draw range) tracks live bolts each frame ≤ this cap
// (r3f.md pooling: allocate once, vary the range). 64 concurrent bolts is far beyond a 12-ship room's fire rate.
const MAX_BOLTS = 64;

// Sample a bolt's interpolated position ~RENDER_DELAY_MS in the past — mirrors remoteInterpSystem: find the two
// snapshots straddling renderTime and lerp; on <2 usable samples (or past the buffer) HOLD the latest; NEVER
// extrapolate. Returns null only for an empty buffer (a just-spawned entity before its first snapshot).
function sampleAt( buffer: ProjSnapshot[], renderTime: number ): ProjSnapshot | null {
    if ( buffer.length === 0 ) return null;
    for ( let i = 0; i < buffer.length - 1; i++ ) {
        const a = buffer[ i ];
        const b = buffer[ i + 1 ];
        if ( a.t <= renderTime && b.t >= renderTime ) {
            const t = ( renderTime - a.t ) / ( b.t - a.t || 1 );
            return {
                t: renderTime,
                x: a.x + ( b.x - a.x ) * t,
                y: a.y + ( b.y - a.y ) * t,
                z: a.z + ( b.z - a.z ) * t,
            };
        }
    }
    return buffer[ buffer.length - 1 ]; // hold latest (renderTime beyond the buffer, or <2 samples)
}

// The bolt archetype: ONE instanced mesh driven imperatively from the ECS (r3f.md instancing + zero React
// re-renders during play). HDR-emissive + toneMapped=false so bolts bloom bright/legible. Reads interp-only
// projectile entities (spawned by the room→world bridge); the client never predicts or hit-tests them.
export function ProjectileField() {
    const world = useWorld();
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const m = useMemo( () => new THREE.Object3D(), [] );

    useFrame( () => {
        const mesh = ref.current;
        if ( ! mesh ) return;
        const renderTime = performance.now() - RENDER_DELAY_MS;
        let i = 0;
        world.query( ProjInterp, NetProjectile ).readEach( ( [ interp ] ) => {
            if ( i >= MAX_BOLTS ) return;
            const pos = sampleAt( interp.buffer, renderTime );
            if ( ! pos ) return;
            m.position.set( pos.x, pos.y, pos.z );
            m.updateMatrix();
            mesh.setMatrixAt( i, m.matrix );
            i++;
        } );
        mesh.count = i; // draw only the live bolts (the "range")
        mesh.instanceMatrix.needsUpdate = true;
    } );

    return (
        <instancedMesh ref={ ref } frustumCulled={ false } args={ [ undefined, undefined, MAX_BOLTS ] }>
            <sphereGeometry args={ [ 0.6, 10, 10 ] } />
            <meshStandardMaterial emissive="#8affff" emissiveIntensity={ 4 } toneMapped={ false } />
        </instancedMesh>
    );
}
