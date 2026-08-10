import { useFrame } from '@react-three/fiber';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Interp, LocalPlayer, Render, Sim } from '../ecs/traits';

// Death VFX: a neon shard-burst at the spot a ship derezzes, so a kill READS (the ship also hides, but a
// silent vanish felt like a bug). Fully imperative — one InstancedMesh pool driven in a single useFrame,
// NO React state / effect / subscription (r3f.md: purely cosmetic pooled particles are leaf-imperative).
// This is the quick playtest-legibility pass; the full TRON derezz is S6.

const MAX = 240; // shard-pool buffer cap (hard — exceeding silently drops). ~6 concurrent bursts of PER_BURST.
const PER_BURST = 40; // shards emitted per death
const LIFE_MIN = 0.5; // shard lifetime range (s)
const LIFE_MAX = 0.95;
const SPEED = 16; // initial outward speed (u/s)
const UP_BIAS = 6; // extra upward velocity so the burst lifts off the deck, not just splats sideways
const DRAG = 2.2; // velocity decay (per s) — shards slow as they fly
const GRAV = 18; // debris gravity (u/s²) → a short arc, not a floaty cloud
const SIZE = 0.16; // shard box edge (world units)
const BRIGHT = 2.6; // HDR multiplier on the tint so shards blow past the bloom threshold (toneMapped=false)

// Module-scope scratch — reused every frame, zero per-frame allocation (r3f hot-path rule).
const _o = new THREE.Object3D();
const _c = new THREE.Color();
const CYAN = new THREE.Color( '#00e5ff' ); // local ship tint (matches ship.tsx beacon)
const MAGENTA = new THREE.Color( '#ff2bd6' ); // remote ship tint

interface Shard {
    active: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    r: number;
    g: number;
    b: number; // tint (0..1), pre-brightness
}

function makePool(): Shard[] {
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
        r: 0,
        g: 0,
        b: 0,
    } ) );
}

// Activate up to PER_BURST idle shards at (x,y,z), flung outward on a random sphere + upward bias.
// Math.random is fine here: this is client-only cosmetics, never the deterministic sim.
function spawnBurst( pool: Shard[], x: number, y: number, z: number, tint: THREE.Color ): void {
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
        p.r = tint.r;
        p.g = tint.g;
        p.b = tint.b;
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

// A ship's `dead` rising-edge → spawn a burst at its (already-synced) Render position. Local ships read
// Sim.dead; remotes read the latest server snapshot. `wasDead` holds last frame's state per entity id.
function detectDeaths( world: World, pool: Shard[], wasDead: Map< number, boolean > ): void {
    for ( const e of world.query( Render ) ) {
        const grp = e.get( Render );
        if ( ! grp ) continue;
        const sim = e.get( Sim );
        const buf = sim ? undefined : e.get( Interp )?.buffer;
        const dead = sim ? sim.dead : buf !== undefined && buf.length > 0 && buf[ buf.length - 1 ].dead;
        const id = e.id();
        if ( dead && ! wasDead.get( id ) ) {
            spawnBurst( pool, grp.position.x, grp.position.y, grp.position.z, e.has( LocalPlayer ) ? CYAN : MAGENTA );
        }
        wasDead.set( id, dead );
    }
}

// Integrate + fade every live shard (brightness eases out, box shrinks); park it when spent.
function advanceShards( mesh: THREE.InstancedMesh, pool: Shard[], dt: number ): void {
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
        const b = BRIGHT * f * f; // ease-out brightness fade so the glow dies gracefully
        mesh.setColorAt( i, _c.setRGB( p.r * b, p.g * b, p.b * b ) );
    }
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}

export function ExplosionField() {
    const world = useWorld();
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const pool = useMemo( makePool, [] );
    const wasDead = useMemo( () => new Map< number, boolean >(), [] ); // entity id → dead last frame (edge detect)
    const inited = useRef( false );

    // Park every pool slot AT MOUNT (callback ref → fires during commit, BEFORE the first paint). Doing this
    // in the first useFrame instead left MAX identity-matrix unit cubes drawn at the origin for one frame — a
    // stray bright cube at the spawn point. A ref callback runs earlier than useFrame, so the pool is hidden
    // before anything is shown. Not a mount EFFECT — no subscription/teardown, just imperative init.
    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        meshRef.current = mesh;
        if ( mesh && ! inited.current ) {
            initPool( mesh );
            inited.current = true;
        }
    }, [] );

    // Fully imperative: detect deaths (after NetLoop synced positions) → spawn, then advance shards.
    useFrame( ( _state, delta ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        detectDeaths( world, pool, wasDead );
        advanceShards( mesh, pool, delta );
    } );

    return (
        // frustumCulled=false: we rewrite instanceMatrix every frame but three computes the bounding
        // sphere ONCE — a stale volume would cull the whole burst as the ship flies on (same reason as
        // TrackView). Additive + no depth-write so overlapping shards sum to a bright, self-glowing flash.
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
