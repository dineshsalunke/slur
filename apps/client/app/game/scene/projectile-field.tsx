import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RENDER_DELAY_MS } from '../ecs/net-systems';
import { NetProjectile, ProjInterp, type ProjSnapshot } from '../ecs/traits';

// Buffer size of the ONE instanced bolt mesh. `count` (draw range) tracks live bolts each frame ≤ this cap
// (r3f.md pooling: allocate once, vary the range). 64 concurrent bolts is far beyond a 12-ship room's fire rate.
const MAX_BOLTS = 64;

// Sample a bolt's interpolated position ~RENDER_DELAY_MS in the past — mirrors remoteInterpSystem: find the two
// snapshots straddling renderTime and lerp; NEVER extrapolate. Returns null only for an empty buffer.
// WARM-UP (renderTime before the first snapshot): hold the FIRST (spawn) pose, NOT the latest. Holding the
// latest showed a just-fired bolt at its true, undelayed position — racing ahead for the first ~RENDER_DELAY_MS,
// then SNAPPING BACK ~90u the instant interpolation kicked in (renderTime crossed buffer[0]). At 120u/s that
// snap was ~12u and invisible; at near-instant speed it read as "two bolts, one vanishes." Holding buffer[0]
// keeps the bolt at its fire point until the delayed clock reaches it, then it launches smoothly — no snap-back.
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

// The bolt archetype: ONE instanced mesh driven imperatively from the ECS (r3f.md instancing + zero React
// re-renders during play). HDR-emissive + toneMapped=false so bolts bloom bright/legible. Reads interp-only
// projectile entities (spawned by the room→world bridge); the client never predicts or hit-tests them.
export function ProjectileField() {
    const world = useWorld();
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const m = useMemo( () => new THREE.Object3D(), [] );

    // Bolt shape (#55): a thin capsule laid along +z reads as a STREAK, not a drifting ball — right for the
    // near-instant speed. CapsuleGeometry runs along Y, so rotate it onto Z ONCE and bake it into the geometry,
    // keeping the per-frame instance writes position-only (no per-instance rotation). Bolts only travel +z, so
    // one baked orientation fits all of them.
    const boltGeo = useMemo( () => {
        const g = new THREE.CapsuleGeometry( 0.055, 30, 4, 8 ); // long thin tracer — reads as a beam-streak at the near-instant speed
        g.rotateX( Math.PI / 2 );
        return g;
    }, [] );

    // Force the draw range to 0 AT MOUNT (callback ref → fires during commit, BEFORE the first paint). The
    // buffer is created with count=MAX_BOLTS, so without this the pool draws MAX_BOLTS identity-matrix spheres
    // stacked at the origin for one frame — a stray flash at the spawn point (#53). useFrame parks the range,
    // but it runs AFTER the first paint, so it cannot prevent frame-1. This is the range-based analogue of the
    // matrix-parking done in explosions.tsx / hit-spark.tsx (those pools always draw MAX, so they park slots;
    // this pool varies count, so zeroing count hides everything). Not a mount EFFECT — just imperative init.
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
