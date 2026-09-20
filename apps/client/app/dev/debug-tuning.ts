import { useSyncExternalStore } from 'react';
import { CHASE } from '../game/camera/chase';
import { GRID_VOID } from '../game/scene/env-config';
import { AMBIENT_INTENSITY } from '../game/scene/lighting';
import { FLOOR_EMISSIVE, FLOOR_EMISSIVE_INTENSITY, FLOOR_ENV_MAP_INTENSITY } from '../game/scene/track-materials';

export interface DebugTuning {
    bloomIntensity: number;
    bloomThreshold: number;
    bloomSmoothing: number;
    bloomRadius: number;
    bloomLevels: number;
    floorEmissiveIntensity: number;
    floorEmissive: string;
    floorEnvMapIntensity: number;
    ambientIntensity: number;
    camHeight: number;
    camBack: number;
    camLookAhead: number;
    camLookAtLift: number;
    camFov: number;
}

// Split by value type rather than one `keyof`: a colour cannot go through a range input, and letting the
// numeric setter accept `floorEmissive` would only fail at runtime.
export type DebugTuningKey = { [ K in keyof DebugTuning ]: DebugTuning[ K ] extends number ? K : never }[
    keyof DebugTuning
];
export type DebugTuningColorKey = { [ K in keyof DebugTuning ]: DebugTuning[ K ] extends string ? K : never }[
    keyof DebugTuning
];

function committed(): DebugTuning {
    return {
        bloomIntensity: GRID_VOID.bloom.intensity,
        bloomThreshold: GRID_VOID.bloom.threshold,
        bloomSmoothing: GRID_VOID.bloom.smoothing,
        bloomRadius: GRID_VOID.bloom.radius,
        bloomLevels: GRID_VOID.bloom.levels,
        floorEmissiveIntensity: FLOOR_EMISSIVE_INTENSITY,
        floorEmissive: FLOOR_EMISSIVE,
        floorEnvMapIntensity: FLOOR_ENV_MAP_INTENSITY,
        ambientIntensity: AMBIENT_INTENSITY,
        camHeight: CHASE.height,
        camBack: CHASE.back,
        camLookAhead: CHASE.lookAhead,
        camLookAtLift: CHASE.lookAtLift,
        camFov: CHASE.fov,
    };
}

export const DEBUG_TUNING: DebugTuning = committed();

const listeners = new Set< () => void >();
let version = 0;

export function subscribeDebugTuning( fn: () => void ): () => void {
    listeners.add( fn );
    return () => listeners.delete( fn );
}

export const debugTuningVersion = () => version;

// Synchronous on purpose. Deferring through rAF made the panel dead in any hidden tab (no rAF) and
// unable to drive a frame-tap capture (advance() does not flush rAF). React already batches per
// event, so a pointermove burst costs one render either way — the coalescing bought nothing.
function notify(): void {
    version++;
    for ( const fn of listeners ) fn();
}

function applyCamera(): void {
    CHASE.height = DEBUG_TUNING.camHeight;
    CHASE.back = DEBUG_TUNING.camBack;
    CHASE.lookAhead = DEBUG_TUNING.camLookAhead;
    CHASE.lookAtLift = DEBUG_TUNING.camLookAtLift;
    CHASE.fov = DEBUG_TUNING.camFov;
}

export function setDebugTuning( key: DebugTuningKey, value: number ): void {
    DEBUG_TUNING[ key ] = value;
    applyCamera();
    notify();
}

export function setDebugTuningColor( key: DebugTuningColorKey, value: string ): void {
    DEBUG_TUNING[ key ] = value;
    notify();
}

export function resetDebugTuning(): void {
    Object.assign( DEBUG_TUNING, committed() );
    applyCamera();
    notify();
}

export function useDebugTuning(): DebugTuning {
    useSyncExternalStore( subscribeDebugTuning, debugTuningVersion, debugTuningVersion );
    return DEBUG_TUNING;
}

const DEG = 180 / Math.PI;

/** The margin the whole camera question turns on: how far below the view axis the ship sits, against
 *  the vertical half-FOV it has to stay inside. */
export function shipBelowAxisDeg( t: DebugTuning ): number {
    return (
        Math.atan2( t.camHeight, t.camBack ) * DEG -
        Math.atan2( t.camHeight - t.camLookAtLift, t.camBack + t.camLookAhead ) * DEG
    );
}

export function pitchDeg( t: DebugTuning ): number {
    return Math.atan2( t.camHeight - t.camLookAtLift, t.camBack + t.camLookAhead ) * DEG;
}

const n = ( v: number ) => ( Number.isInteger( v ) ? String( v ) : v.toFixed( 3 ).replace( /0+$/, '' ) );

/** The current set as literal source, so whatever is landed on gets committed verbatim. */
export function debugTuningSource( t: DebugTuning ): string {
    return [
        '// game/camera/chase.ts — CHASE',
        `height: ${ n( t.camHeight ) },`,
        `back: ${ n( t.camBack ) },`,
        `lookAhead: ${ n( t.camLookAhead ) },`,
        `lookAtLift: ${ n( t.camLookAtLift ) },`,
        `fov: ${ n( t.camFov ) },`,
        '',
        '// game/scene/env-config.ts — GRID_VOID',
        `bloom: { intensity: ${ n( t.bloomIntensity ) }, threshold: ${ n( t.bloomThreshold ) }, smoothing: ${ n(
            t.bloomSmoothing,
        ) }, radius: ${ n( t.bloomRadius ) }, levels: ${ n( t.bloomLevels ) } },`,
        '',
        '// game/scene/track-materials.ts',
        `export const FLOOR_EMISSIVE = '${ t.floorEmissive }';`,
        `export const FLOOR_EMISSIVE_INTENSITY = ${ n( t.floorEmissiveIntensity ) };`,
        `export const FLOOR_ENV_MAP_INTENSITY = ${ n( t.floorEnvMapIntensity ) };`,
        '',
        '// game/scene/lighting.tsx',
        `export const AMBIENT_INTENSITY = ${ n( t.ambientIntensity ) };`,
    ].join( '\n' );
}
