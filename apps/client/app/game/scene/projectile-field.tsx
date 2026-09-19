import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RENDER_DELAY_MS } from '../ecs/net-systems';
import { NetProjectile, ProjInterp, type ProjSnapshot } from '../ecs/traits';

// Buffer size of the ONE instanced bolt mesh. `count` (draw range) tracks live bolts each frame ≤ this cap
// (r3f.md pooling: allocate once, vary the range). 64 concurrent bolts is far beyond a 12-ship room's fire rate.
const MAX_BOLTS = 64;

// Sample a bolt's interpolated position ~RENDER_DELAY_MS in the past: lerp the two snapshots straddling
// renderTime, and NEVER extrapolate. During warm-up hold the FIRST pose, not the latest — holding the latest
// runs the bolt at its undelayed position and then snaps it back the instant interpolation takes over.
function sampleAt( buffer: ProjSnapshot[], renderTime: number ): ProjSnapshot | null {
    if ( buffer.length === 0 ) return null;
    if ( renderTime <= buffer[ 0 ].t ) return buffer[ 0 ]; // warm-up: hold at spawn, don't race to latest then snap back
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
    return buffer[ buffer.length - 1 ]; // renderTime past the last sample → hold latest (bolt about to be pruned)
}

// The bolt archetype: one instanced mesh driven imperatively from the ECS. HDR-emissive with toneMapped off
// so bolts bloom. Bolts are interp-only — the client never predicts or hit-tests them, the server does.
export function ProjectileField() {
    const world = useWorld();
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const m = useMemo( () => new THREE.Object3D(), [] );

    // A thin capsule along +z reads as a streak rather than a drifting ball. CapsuleGeometry runs along Y, so
    // the rotation onto Z is baked in once — bolts only travel +z, and instance writes stay position-only.
    const boltGeo = useMemo( () => {
        const g = new THREE.CapsuleGeometry( 0.055, 30, 4, 8 ); // long thin tracer — reads as a beam-streak at the near-instant speed
        g.rotateX( Math.PI / 2 );
        return g;
    }, [] );

    // Effect justified: brackets a GPU resource's lifetime. boltGeo is `new`'d in useMemo and attached via
    // <primitive object>, so R3F never disposes it — it only owns JSX-declared geometries.
    useEffect( () => () => boltGeo.dispose(), [ boltGeo ] );

    // Zero the draw range at mount via a callback ref, which runs during commit and so beats the first paint.
    // useFrame would park it a frame too late, flashing MAX_BOLTS identity-matrix bolts at the origin.
    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        ref.current = mesh;
        if ( mesh ) mesh.count = 0;
    }, [] );

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
        <instancedMesh ref={ setMesh } frustumCulled={ false } args={ [ undefined, undefined, MAX_BOLTS ] }>
            <primitive object={ boltGeo } attach="geometry" />
            <meshStandardMaterial emissive="#8affff" emissiveIntensity={ 4 } toneMapped={ false } />
        </instancedMesh>
    );
}
