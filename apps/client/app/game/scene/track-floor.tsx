import { useFrame } from '@react-three/fiber';
import { CELL, LEAD_SEGMENTS, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useDebugTuning } from '../../dev/debug-tuning';
import { LocalPlayer, Sim } from '../ecs/traits';
import { createEmitterUniforms, EMITTER_SLOTS, parkEmitter, patchEmitterLight, writeEmitter } from './emitter-array';
import {
    BACKWARD,
    BOUNDARY_H,
    BOUNDARY_W,
    DOWN,
    FORWARD,
    isOuterEdge,
    LEFT,
    packGeometry,
    pushQuad,
    RIGHT,
    UP,
    type V3,
} from './track-geometry';
import { AHEAD } from './track-instancing';
import {
    FLOOR_ENV_MAP_INTENSITY,
    floorSurface,
    MARIGOLD_EMISSIVE,
    RAIL_EMITTER_DECAY,
    RAIL_EMITTER_INTENSITY,
    RAIL_EMITTER_LIFT,
    RAIL_EMITTER_RANGE,
} from './track-materials';
import { buildRailRuns, type RailRun, railRunDistance } from './track-rails';

const RAIL_COLOR = new THREE.Color( MARIGOLD_EMISSIVE );
const _view = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _near: RailRun[] = [];
const _dist: number[] = [];

function feedEmitters(
    uniforms: ReturnType< typeof createEmitterUniforms >,
    runs: RailRun[],
    z: number,
    camera: THREE.Camera,
    intensity: number,
    range: number,
): void {
    uniforms.uEmitterAxis.value.copy( _axis.set( 0, 0, 1 ).transformDirection( camera.matrixWorldInverse ) );

    const n = selectNearest( runs, z, EMITTER_SLOTS );
    let slot = 0;
    for ( let i = 0; i < n; i++ ) {
        const run = _near[ i ];
        const z0 = Math.max( run.z0, z - range );
        const z1 = Math.min( run.z1, z + range );
        if ( z1 <= z0 ) continue;
        _view.set( run.x, run.y, ( z0 + z1 ) / 2 ).applyMatrix4( camera.matrixWorldInverse );
        writeEmitter( uniforms, slot, _view, ( z1 - z0 ) / 2, RAIL_COLOR, intensity, range );
        slot++;
    }
    for ( let i = slot; i < EMITTER_SLOTS; i++ ) parkEmitter( uniforms, i );
}

function selectNearest( runs: RailRun[], z: number, limit: number ): number {
    let n = 0;
    for ( const run of runs ) {
        const d = railRunDistance( run, z );
        let at = n;
        while ( at > 0 && _dist[ at - 1 ] > d ) at--;
        if ( at >= limit ) continue;
        for ( let k = Math.min( n, limit - 1 ); k > at; k-- ) {
            _near[ k ] = _near[ k - 1 ];
            _dist[ k ] = _dist[ k - 1 ];
        }
        _near[ at ] = run;
        _dist[ at ] = d;
        if ( n < limit ) n++;
    }
    return n;
}

/**
 * Downward extrusion of the slab (world units). The sim never reads it — its floor is a plane at y=0.
 * Constrained from one side only: thickness must not conceal a gap from a low camera, so thicker reads
 * more solid but hides holes ("slab thickness must not conceal the gap at low camera height", handoff §5).
 */
export const SLAB_THICKNESS = 2;

/**
 * True when `other` covers [x0,x1] at the SAME height, so the slab continues and needs no end cap.
 * Height is part of the test: two spans at different `y` are a step, and merging them eats its cap.
 */
function continues( other: Segment | null, x0: number, x1: number, y: number ): boolean {
    return other
        ? other.floors.some( ( f ) => f.x0 <= x0 + 1e-4 && f.x1 >= x1 - 1e-4 && Math.abs( f.y - y ) < 1e-4 )
        : false;
}

const isOffGrid = ( v: number ) => {
    const m = Math.abs( v % CELL );
    return m > 1e-4 && Math.abs( m - CELL ) > 1e-4;
};

/**
 * One floor span: top face, both side walls, and end caps only where the slab genuinely ends —
 * unconditional caps would bury coplanar back-to-back faces between adjacent spans and z-fight.
 *
 * The rail stands outboard of the span, so the wall moves out under it and the top face is untouched.
 */
function emitSpan(
    pos: number[],
    uv: number[],
    span: { x0: number; x1: number; y: number },
    z0: number,
    z1: number,
    capFront: boolean,
    capBack: boolean,
    w: number,
    h: number,
): void {
    const { x0, x1 } = span;
    // The span's own height, not 0. Every span the generator emits today sits at y=0, but `FloorSpan.y`
    // is what the boundary rides, so honouring it keeps a future raised platform correct by construction.
    const t = span.y;
    const b = span.y - SLAB_THICKNESS;
    const sideL = isOuterEdge( x0 ) ? x0 - w : x0;
    const sideR = isOuterEdge( x1 ) ? x1 + w : x1;
    const lip = t + h;
    const lipL = isOuterEdge( x0 ) ? lip : t;
    const lipR = isOuterEdge( x1 ) ? lip : t;

    // Top face — the surface you fly over, and the physics hull itself: what you see is what you hit.
    // It spans x0..x1 unconditionally: ADR-012 — no drawn element may take playable width, at any setting.
    pushQuad( pos, uv, [ x0, t, z0 ], [ x0, t, z1 ], [ x1, t, z1 ], [ x1, t, z0 ], 'xz', UP );

    // Side walls — visible thickness, so a gap reads as a hole with depth, not a flat dark patch.
    pushQuad( pos, uv, [ sideL, b, z0 ], [ sideL, lipL, z0 ], [ sideL, lipL, z1 ], [ sideL, b, z1 ], 'zy', LEFT );
    pushQuad( pos, uv, [ sideR, lipR, z0 ], [ sideR, b, z0 ], [ sideR, b, z1 ], [ sideR, lipR, z1 ], 'zy', RIGHT );

    // End caps follow the lip, so the cap rises with the band instead of squaring across it.
    const cap = ( z: number, n: V3 ) => {
        if ( sideL < x0 - 1e-4 )
            pushQuad( pos, uv, [ sideL, b, z ], [ x0, b, z ], [ x0, t, z ], [ sideL, lipL, z ], 'xy', n );
        pushQuad( pos, uv, [ x0, b, z ], [ x1, b, z ], [ x1, t, z ], [ x0, t, z ], 'xy', n );
        if ( sideR > x1 + 1e-4 )
            pushQuad( pos, uv, [ x1, b, z ], [ sideR, b, z ], [ sideR, lipR, z ], [ x1, t, z ], 'xy', n );
    };
    if ( capFront ) cap( z0, BACKWARD );
    if ( capBack ) cap( z1, FORWARD );

    // Underside — seen when you fall into a gap, and it closes the solid against a low camera.
    pushQuad( pos, uv, [ sideL, b, z0 ], [ sideL, b, z1 ], [ sideR, b, z1 ], [ sideR, b, z0 ], 'xz', DOWN );
}

/**
 * One capped slab span, for showing a slice of ribbon outside the game (the gallery).
 *
 * Not a `boxGeometry`: box UVs are normalised per face, which would stretch one tile across the whole
 * 64u width and show the gallery a finish the game never renders.
 */
export function buildSpanGeometry(
    x0: number,
    x1: number,
    z0: number,
    z1: number,
    w = BOUNDARY_W,
    h = BOUNDARY_H,
): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    emitSpan( pos, uv, { x0, x1, y: 0 }, z0, z1, true, true, w, h );
    return packGeometry( pos, uv );
}

/** How many segments the generated meshes span: the whole track, plus the run-out pad past the finish
 *  line — the leader-grace window is flown over it, so bounding at the line leaves it floorless. */
export function segmentCount( track: Track ): number {
    return Math.round( track.finishZ / SEG_LEN ) + Math.ceil( AHEAD / SEG_LEN );
}

/**
 * The whole ribbon as ONE geometry, from the sim's own `FloorSpan` data.
 *
 * One mesh rather than instanced tiles: tiles repeat every 4u, which is the dense seam grid the art
 * direction rejects. Spans rather than a lane grid: their 4u alignment is a generator artifact and not a
 * rule (GDD §0), so reading spans keeps the visual hull equal to the physics hull whatever it does later.
 */
function buildFloorGeometry( track: Track, w: number, h: number ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    const last = segmentCount( track );

    for ( let i = -LEAD_SEGMENTS; i < last; i++ ) {
        const seg = track.segmentAt( i );
        const prev = i > -LEAD_SEGMENTS ? track.segmentAt( i - 1 ) : null;
        const next = i < last - 1 ? track.segmentAt( i + 1 ) : null;

        for ( const f of seg.floors ) {
            if ( import.meta.env.DEV && ( isOffGrid( f.x0 ) || isOffGrid( f.x1 ) ) ) {
                // Not an error — it still renders. But the art is authored to a 4u rhythm, so a generator
                // change that breaks alignment must be noticed rather than quietly absorbed.
                console.warn( `[track-floor] seg ${ i } span not CELL-aligned: ${ f.x0 }..${ f.x1 }` );
            }
            emitSpan(
                pos,
                uv,
                f,
                seg.z0,
                seg.z1,
                ! continues( prev, f.x0, f.x1, f.y ),
                ! continues( next, f.x0, f.x1, f.y ),
                w,
                h,
            );
        }
    }

    return packGeometry( pos, uv );
}

/** The ribbon surface as a single generated mesh, with real thickness. Deck only — the boundary strip
 *  and the blocks come from `TrackView`. */
export function TrackFloor( { track }: { track: Track } ) {
    // The deck's outer edge answers to the boundary's shape, so it rebuilds with the strip or the two desync.
    const tuning = useDebugTuning();
    const world = useWorld();
    const w = import.meta.env.DEV ? tuning.boundaryWidth : BOUNDARY_W;
    const h = import.meta.env.DEV ? tuning.boundaryWrap : BOUNDARY_H;
    const geo = useMemo( () => buildFloorGeometry( track, w, h ), [ track, w, h ] );
    const lift = import.meta.env.DEV ? tuning.emitterLift : RAIL_EMITTER_LIFT;
    const runs = useMemo( () => buildRailRuns( track, segmentCount( track ), w, h, lift ), [ track, w, h, lift ] );
    const uniforms = useMemo( createEmitterUniforms, [] );
    const matRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const patched = useRef( false );
    const range = import.meta.env.DEV ? tuning.emitterRange : RAIL_EMITTER_RANGE;
    const intensity = import.meta.env.DEV ? tuning.emitterIntensity : RAIL_EMITTER_INTENSITY;
    const decay = import.meta.env.DEV ? tuning.emitterDecay : RAIL_EMITTER_DECAY;

    // GPU buffers outlive React's tree: a geometry replaced by a width change must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    useFrame( ( { camera } ) => {
        const mat = matRef.current;
        if ( ! mat ) return;
        if ( ! patched.current ) {
            patchEmitterLight( mat, uniforms );
            patched.current = true;
        }

        uniforms.uEmitterDecay.value = decay;
        const z = world.queryFirst( LocalPlayer, Sim )?.get( Sim )?.z ?? 0;
        feedEmitters( uniforms, runs, z, camera, intensity, range );
    } );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial
                ref={ matRef }
                { ...floorSurface() }
                envMapIntensity={ import.meta.env.DEV ? tuning.floorEnvMapIntensity : FLOOR_ENV_MAP_INTENSITY }
            />
        </mesh>
    );
}
