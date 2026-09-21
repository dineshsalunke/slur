import { useSyncExternalStore } from 'react';
import { CHASE } from '../game/camera/chase';
import { KEY_BEARING_DEG, KEY_ELEVATION_DEG, KEY_INTENSITY } from '../game/scene/cold-key';
import { GRID_VOID } from '../game/scene/env-config';
import { AMBIENT_INTENSITY } from '../game/scene/lighting';
import { BOUNDARY_H, BOUNDARY_W } from '../game/scene/track-geometry';
import {
    FLOOR_ENV_MAP_INTENSITY,
    FLOOR_METALNESS,
    FLOOR_ROUGHNESS,
    MARIGOLD_REFERENCE_INTENSITY,
    RAIL_EMITTER_DECAY,
    RAIL_EMITTER_INTENSITY,
    RAIL_EMITTER_LIFT,
    RAIL_EMITTER_RANGE,
} from '../game/scene/track-materials';

export interface DebugTuning {
    bloomIntensity: number;
    bloomThreshold: number;
    bloomSmoothing: number;
    bloomRadius: number;
    bloomLevels: number;
    floorRoughness: number;
    floorMetalness: number;
    floorEnvMapIntensity: number;
    marigoldReference: number;
    emitterIntensity: number;
    emitterRange: number;
    emitterDecay: number;
    emitterLift: number;
    boundaryWidth: number;
    boundaryWrap: number;
    ambientIntensity: number;
    keyIntensity: number;
    keyElevation: number;
    keyBearing: number;
    camHeight: number;
    camBack: number;
    camLookAhead: number;
    camLookAtLift: number;
    camFov: number;
}

export type DebugTuningKey = { [ K in keyof DebugTuning ]: DebugTuning[ K ] extends number ? K : never }[
    keyof DebugTuning
];

function committed(): DebugTuning {
    return {
        bloomIntensity: GRID_VOID.bloom.intensity,
        bloomThreshold: GRID_VOID.bloom.threshold,
        bloomSmoothing: GRID_VOID.bloom.smoothing,
        bloomRadius: GRID_VOID.bloom.radius,
        bloomLevels: GRID_VOID.bloom.levels,
        floorRoughness: FLOOR_ROUGHNESS,
        floorMetalness: FLOOR_METALNESS,
        floorEnvMapIntensity: FLOOR_ENV_MAP_INTENSITY,
        marigoldReference: MARIGOLD_REFERENCE_INTENSITY,
        emitterIntensity: RAIL_EMITTER_INTENSITY,
        emitterRange: RAIL_EMITTER_RANGE,
        emitterDecay: RAIL_EMITTER_DECAY,
        emitterLift: RAIL_EMITTER_LIFT,
        boundaryWidth: BOUNDARY_W,
        boundaryWrap: BOUNDARY_H,
        ambientIntensity: AMBIENT_INTENSITY,
        keyIntensity: KEY_INTENSITY,
        keyElevation: KEY_ELEVATION_DEG,
        keyBearing: KEY_BEARING_DEG,
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
        `export const FLOOR_ROUGHNESS = ${ n( t.floorRoughness ) };`,
        `export const FLOOR_METALNESS = ${ n( t.floorMetalness ) };`,
        `export const FLOOR_ENV_MAP_INTENSITY = ${ n( t.floorEnvMapIntensity ) };`,
        `export const MARIGOLD_REFERENCE_INTENSITY = ${ n( t.marigoldReference ) };`,
        `export const RAIL_EMITTER_INTENSITY = ${ n( t.emitterIntensity ) };`,
        `export const RAIL_EMITTER_RANGE = ${ n( t.emitterRange ) };`,
        `export const RAIL_EMITTER_DECAY = ${ n( t.emitterDecay ) };`,
        `export const RAIL_EMITTER_LIFT = ${ n( t.emitterLift ) };`,
        '',
        '// game/scene/track-geometry.ts',
        `export const BOUNDARY_W = ${ n( t.boundaryWidth ) };`,
        `export const BOUNDARY_H = ${ n( t.boundaryWrap ) };`,
        '',
        '// game/scene/lighting.tsx',
        `export const AMBIENT_INTENSITY = ${ n( t.ambientIntensity ) };`,
        '',
        '// game/scene/cold-key.tsx',
        `export const KEY_BEARING_DEG = ${ n( t.keyBearing ) };`,
        `export const KEY_ELEVATION_DEG = ${ n( t.keyElevation ) };`,
        `export const KEY_INTENSITY = ${ n( t.keyIntensity ) };`,
    ].join( '\n' );
}
