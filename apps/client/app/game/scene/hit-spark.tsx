import { useFrame } from '@react-three/fiber';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { drainHits } from './hit-events';

// Bolt-impact spark: a sharp cosmetic flash at the (x,y,z) the server reports in its 'hit' broadcast, so a
// landed hit READS instantly (before the victim's stun even reconciles). Fully imperative — one additive HDR
// InstancedMesh pool drained from the hit-events queue in a single useFrame, NO React state/effect/subscription
// (r3f.md: purely cosmetic pooled particles are leaf-imperative). Mirrors ExplosionField, tuned tighter/faster
// (a quick pop, not debris) and a hotter cyan-white so it's unmistakable vs the ship-derezz shard burst.

const MAX = 200; // spark-pool buffer cap (hard — exceeding silently drops). ~8 concurrent bursts of PER_BURST.
const PER_BURST = 22; // sparks emitted per hit
const LIFE_MIN = 0.18; // spark lifetime range (s) — short, punchy
const LIFE_MAX = 0.4;
const SPEED = 22; // initial outward speed (u/s)
const UP_BIAS = 2; // slight upward lift (mostly a radial pop, not an arc)
const DRAG = 4; // fast velocity decay (per s) so the pop snaps to a stop
const GRAV = 6; // light gravity (u/s²) — barely falls in its short life
const SIZE = 0.15; // spark box edge (world units)
const BRIGHT = 3.2; // HDR multiplier so sparks blow past the bloom threshold (toneMapped=false)

// Module-scope scratch — reused every frame, zero per-frame allocation (r3f hot-path rule).
const _o = new THREE.Object3D();
const _c = new THREE.Color();
const SPARK = new THREE.Color( '#a8ffff' ); // hot cyan-white — distinct from the ship derezz tints

interface Spark {
    active: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
}

function makePool(): Spark[] {
    return Array.from( { length: MAX }, () => ( {
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
    } ) );
}

// Activate up to PER_BURST idle sparks at (x,y,z), flung outward on a random sphere + slight upward bias.
// Math.random is fine here: client-only cosmetics, never the deterministic sim.
function spawnBurst( pool: Spark[], x: number, y: number, z: number ): void {
    let n = 0;
    for ( let i = 0; i < MAX && n < PER_BURST; i++ ) {
        const p = pool[ i ];
        if ( p.active ) continue;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos( 2 * Math.random() - 1 );
        const speed = SPEED * ( 0.5 + Math.random() );
        p.active = true;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = Math.sin( phi ) * Math.cos( theta ) * speed;
        p.vz = Math.sin( phi ) * Math.sin( theta ) * speed;
        p.vy = Math.cos( phi ) * speed + UP_BIAS;
        p.maxLife = p.life = LIFE_MIN + Math.random() * ( LIFE_MAX - LIFE_MIN );
        n++;
    }
}

function park( mesh: THREE.InstancedMesh, i: number ): void {
    _o.position.set( 0, -9999, 0 );
    _o.scale.set( 0, 0, 0 );
    _o.updateMatrix();
    mesh.setMatrixAt( i, _o.matrix );
}

// One-time: park every slot + touch every color so the instanceColor buffer is allocated (no mount effect).
function initPool( mesh: THREE.InstancedMesh ): void {
    for ( let i = 0; i < MAX; i++ ) {
        park( mesh, i );
        mesh.setColorAt( i, _c.setRGB( 0, 0, 0 ) );
    }
}

// Integrate + fade every live spark (brightness eases out, box shrinks); park it when spent.
function advanceSparks( mesh: THREE.InstancedMesh, pool: Spark[], dt: number ): void {
    const damp = Math.max( 0, 1 - DRAG * dt );
    for ( let i = 0; i < MAX; i++ ) {
        const p = pool[ i ];
        if ( ! p.active ) continue;
        p.life -= dt;
        if ( p.life <= 0 ) {
            p.active = false;
            park( mesh, i );
            continue;
        }
        p.vy -= GRAV * dt;
        p.vx *= damp;
        p.vy *= damp;
        p.vz *= damp;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        const f = p.life / p.maxLife; // 1 → 0 over life
        const s = SIZE * ( 0.35 + 0.75 * f );
        _o.position.set( p.x, p.y, p.z );
        _o.scale.set( s, s, s );
        _o.updateMatrix();
        mesh.setMatrixAt( i, _o.matrix );
        const b = BRIGHT * f * f; // ease-out brightness fade so the flash dies gracefully
        mesh.setColorAt( i, _c.setRGB( SPARK.r * b, SPARK.g * b, SPARK.b * b ) );
    }
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}

export function HitSpark() {
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const pool = useMemo( makePool, [] );
    const inited = useRef( false );

    // Park the pool AT MOUNT via a callback ref (fires during commit, before the first paint) so the MAX
    // identity-matrix unit cubes never flash at the origin for a frame. See ExplosionField for the full note.
    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        meshRef.current = mesh;
        if ( mesh && ! inited.current ) {
            initPool( mesh );
            inited.current = true;
        }
    }, [] );

    // Fully imperative: drain queued hit events → spawn a burst each, then advance sparks. No subscription.
    useFrame( ( _state, delta ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        drainHits( ( e ) => spawnBurst( pool, e.x, e.y, e.z ) );
        advanceSparks( mesh, pool, delta );
    } );

    return (
        // frustumCulled=false: we rewrite instanceMatrix every frame but three computes the bounding sphere
        // ONCE — a stale volume would cull the whole burst as the ship flies on (same reason as ExplosionField).
        // Additive + no depth-write so overlapping sparks sum to a bright, self-glowing flash.
        <instancedMesh ref={ setMesh } frustumCulled={ false } args={ [ undefined, undefined, MAX ] }>
            <boxGeometry args={ [ 1, 1, 1 ] } />
            <meshBasicMaterial
                toneMapped={ false }
                transparent
                depthWrite={ false }
                blending={ THREE.AdditiveBlending }
            />
        </instancedMesh>
    );
}
