import { Clone, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Entity } from 'koota';
import { Fragment, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Interp, Sim } from '../ecs/traits';
import { SHIP_VISUALS, shipVisual } from './ship-visuals';

// Per-ship model (Quaternius CC0). useGLTF caches by URL, so each model loads once; drei <Clone>
// deep-clones it per entity so many ships mount independently while sharing geometry/material. The parent
// (ShipView) keys this on shipId, so a class hot-swap remounts with the new model. scale/lift/facing come
// from ship-visuals.ts, DERIVED so the model box == the class AABB footprint (WYSIWYG collision).
for ( const v of Object.values( SHIP_VISUALS ) ) useGLTF.preload( v.url ); // preload all 5 → no hot-swap hitch

// ── S6 TRON derezz — noise-threshold DISSOLVE on the ship's GLTF meshes (phase note Q5: dissolve shader,
// keep the shard-burst in explosions.tsx as a complementary accent). onBeforeCompile injects a value-noise
// `discard` driven by a per-ship `uDissolve` uniform (0 = solid → 1 = gone) plus a bright emissive burn edge
// at the dissolve front. `uDissolve` is driven by ONE local useFrame reading the entity's dead state — NO
// React state per frame (r3f.md: purely-cosmetic per-frame work is leaf-imperative, refs/uniforms only).
// `deep="materialsOnly"` on <Clone> gives each ship its OWN material clones, so the uniform is per-entity.

const DISSOLVE_DURATION = 0.7; // s — dead→gone ramp (and gone→solid dissolve-in on respawn). Tune to taste.
const DISSOLVE_NOISE_SCALE = 1.8; // noise cells across the (object-space) hull — higher = finer speckle
const DISSOLVE_EDGE_WIDTH = 0.09; // width of the glowing burn band trailing the dissolve front (noise units)
const DISSOLVE_EDGE_INTENSITY = 2.6; // HDR add on the burn edge (post-tonemap → blows past the bloom threshold)

// Emissive strength of the team wash on the hull. The models carry their own albedo, so we tint EMISSIVE
// rather than replace base colour — the sculpt stays readable while the ship still reads as "that green one
// is mine" at race distance under bloom. Low enough that it does not flatten into a glowing blob.
const HULL_TINT_INTENSITY = 0.55;

interface DissolveUniforms {
    uDissolve: { value: number };
    uNoiseScale: { value: number };
    uEdgeWidth: { value: number };
    uEdgeColor: { value: THREE.Color };
    uEdgeIntensity: { value: number };
}

// value-noise + uniforms/varying declarations, prepended to the fragment shader (top-level, before main()).
const DISSOLVE_FRAG_HEAD = /* glsl */ `
uniform float uDissolve;
uniform float uNoiseScale;
uniform float uEdgeWidth;
uniform vec3 uEdgeColor;
uniform float uEdgeIntensity;
varying vec3 vDissolvePos;
float dsvHash( vec3 p ) { return fract( sin( dot( p, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453123 ); }
float dsvNoise( vec3 x ) {
    vec3 i = floor( x ); vec3 f = fract( x ); f = f * f * ( 3.0 - 2.0 * f );
    return mix(
        mix( mix( dsvHash( i + vec3( 0., 0., 0. ) ), dsvHash( i + vec3( 1., 0., 0. ) ), f.x ),
             mix( dsvHash( i + vec3( 0., 1., 0. ) ), dsvHash( i + vec3( 1., 1., 0. ) ), f.x ), f.y ),
        mix( mix( dsvHash( i + vec3( 0., 0., 1. ) ), dsvHash( i + vec3( 1., 0., 1. ) ), f.x ),
             mix( dsvHash( i + vec3( 0., 1., 1. ) ), dsvHash( i + vec3( 1., 1., 1. ) ), f.x ), f.y ), f.z );
}
`;

// clip away everything the dissolve front has already passed. `dsvN` is reused by the edge inject below.
const DISSOLVE_DISCARD = /* glsl */ `
    float dsvN = dsvNoise( vDissolvePos * uNoiseScale );
    if ( uDissolve > 0.001 && dsvN < uDissolve ) discard;
`;

// bright burn band on the fragments just ahead of the front — added AFTER tonemapping/colorspace (sRGB),
// so a strong add survives into the bloom pass instead of being clamped by tone mapping.
const DISSOLVE_EDGE = /* glsl */ `
    if ( uDissolve > 0.001 ) {
        float dsvEdge = 1.0 - smoothstep( uDissolve, uDissolve + uEdgeWidth, dsvN );
        gl_FragColor.rgb += uEdgeColor * dsvEdge * uEdgeIntensity;
    }
`;

// Patch a cloned GLTF material ONCE (guarded via userData) to inject the dissolve. We hand it the SAME
// uniform objects the useFrame mutates, so a single `.value` write drives every mesh of the ship.
function patchDissolve( mat: THREE.Material, uniforms: DissolveUniforms ): void {
    if ( mat.userData.dissolvePatched ) return;
    mat.userData.dissolvePatched = true;
    mat.onBeforeCompile = ( shader ) => {
        shader.uniforms.uDissolve = uniforms.uDissolve;
        shader.uniforms.uNoiseScale = uniforms.uNoiseScale;
        shader.uniforms.uEdgeWidth = uniforms.uEdgeWidth;
        shader.uniforms.uEdgeColor = uniforms.uEdgeColor;
        shader.uniforms.uEdgeIntensity = uniforms.uEdgeIntensity;
        shader.vertexShader = `varying vec3 vDissolvePos;\n${ shader.vertexShader }`.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\n\tvDissolvePos = position;',
        );
        shader.fragmentShader = ( DISSOLVE_FRAG_HEAD + shader.fragmentShader )
            .replace(
                '#include <clipping_planes_fragment>',
                `#include <clipping_planes_fragment>${ DISSOLVE_DISCARD }`,
            )
            .replace( '#include <dithering_fragment>', `#include <dithering_fragment>${ DISSOLVE_EDGE }` );
    };
    mat.needsUpdate = true; // force a recompile so onBeforeCompile runs (material was already compiled once)
}

// Wash one cloned material in the owner's team colour. Materials are per-entity clones (<Clone
// deep="materialsOnly">), so mutating here never leaks into another ship. Non-standard materials are left
// alone rather than guessed at.
function tintHull( mat: THREE.Material, color: string ): void {
    const std = mat as THREE.MeshStandardMaterial;
    if ( ! std.isMeshStandardMaterial ) return;
    std.emissive.set( color );
    std.emissiveIntensity = HULL_TINT_INTENSITY;
}

// A ship's `dead`: local entities read the live Sim; remotes read the latest server snapshot (same rule as
// explosions.tsx). Allocation-free — safe to call every frame.
function isDead( entity: Entity ): boolean {
    const sim = entity.get( Sim );
    if ( sim ) return sim.dead;
    const buf = entity.get( Interp )?.buffer;
    return buf !== undefined && buf.length > 0 && buf[ buf.length - 1 ].dead;
}

export function ShipModel( { entity, shipId, color }: { entity: Entity; shipId: string; color: string } ) {
    const v = shipVisual( shipId );
    const { scene } = useGLTF( v.url );
    const cloneRef = useRef< THREE.Group >( null );
    const beaconRef = useRef< THREE.Mesh >( null );
    const patched = useRef( false );
    const appliedColor = useRef( '' );
    // One uniforms bundle per ship; the same value-objects flow into every patched material of this clone.
    // The burn edge is the OWNER'S team colour — it used to be cyan-for-local / magenta-for-remote, but
    // magenta is retired from the palette and "whose ship just derezzed" is the more useful read anyway.
    //
    // The dep list MUST stay empty. patchDissolve binds these objects into the shader BY REFERENCE, once,
    // in the first-frame patch below. Rebuilding the bundle (on `color`, say) yields an object the materials
    // never sample — they keep reading the original, and every later write lands on an orphan. Colour
    // updates ride the `.set()` in useFrame instead, which mutates the exact object the shader holds.
    const uniforms = useMemo< DissolveUniforms >(
        () => ( {
            uDissolve: { value: 0 },
            uNoiseScale: { value: DISSOLVE_NOISE_SCALE },
            uEdgeWidth: { value: DISSOLVE_EDGE_WIDTH },
            uEdgeColor: { value: new THREE.Color() }, // seeded by the first useFrame pass, long before any dissolve
            uEdgeIntensity: { value: DISSOLVE_EDGE_INTENSITY },
        } ),
        [],
    );

    // Leaf-imperative: on the first frame patch the cloned materials, then every frame ease uDissolve toward
    // 1 (dead) or 0 (alive) — dead→gone dissolve-out, and a dissolve-IN on respawn. No React state involved.
    useFrame( ( _state, delta ) => {
        const grp = cloneRef.current;
        if ( ! grp ) return;
        if ( ! patched.current ) {
            grp.traverse( ( o ) => {
                const mesh = o as THREE.Mesh;
                if ( ! mesh.isMesh ) return;
                const mats = Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ];
                for ( const mat of mats ) patchDissolve( mat, uniforms );
            } );
            patched.current = true;
        }
        // Re-wash the hull whenever the owner picks a new colour in the lobby. Costs a string compare per
        // frame; the traverse only runs on an actual change. Kept here rather than in an effect because the
        // materials are three.js state, and this file already owns them imperatively.
        if ( appliedColor.current !== color ) {
            uniforms.uEdgeColor.value.set( color );
            grp.traverse( ( o ) => {
                const mesh = o as THREE.Mesh;
                if ( ! mesh.isMesh ) return;
                const mats = Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ];
                for ( const mat of mats ) tintHull( mat, color );
            } );
            appliedColor.current = color;
        }
        const target = isDead( entity ) ? 1 : 0;
        const u = uniforms.uDissolve;
        const step = delta / DISSOLVE_DURATION;
        if ( u.value < target ) u.value = Math.min( target, u.value + step );
        else if ( u.value > target ) u.value = Math.max( target, u.value - step );
        // Fade the beacon out with the hull so a fully-derezzed ship doesn't leave a glowing orb behind.
        if ( beaconRef.current ) beaconRef.current.visible = u.value < 0.99;
    } );

    return (
        <Fragment>
            <Clone
                ref={ cloneRef }
                object={ scene }
                deep="materialsOnly"
                position={ [ 0, v.lift, 0 ] }
                scale={ v.scale }
                rotation={ v.facing }
            />
            { /* team-colour beacon (emissive, blooms) so local=cyan vs remote=magenta stays legible —
                 an unlit mesh, NOT a pointLight, to avoid the many-dynamic-lights perf cliff. */ }
            <mesh ref={ beaconRef } position={ [ 0, 1, 0 ] }>
                <sphereGeometry args={ [ 0.22, 12, 12 ] } />
                <meshStandardMaterial emissive={ color } emissiveIntensity={ 3 } toneMapped={ false } />
            </mesh>
        </Fragment>
    );
}
