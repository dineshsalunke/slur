import { useSyncExternalStore } from 'react';
import { CHASE } from '../game/camera/chase';
import { KEY_BEARING_DEG, KEY_ELEVATION_DEG, KEY_INTENSITY } from '../game/scene/cold-key';
import { GRID_VOID } from '../game/scene/env-config';
import { AMBIENT_INTENSITY } from '../game/scene/lighting';
import {
    MONOLITH_BELOW,
    MONOLITH_DEPTH,
    MONOLITH_GAP,
    MONOLITH_HEIGHT,
    MONOLITH_SEAM_INTENSITY,
    MONOLITH_SPACING_CALM,
    MONOLITH_SPACING_INTENSE,
    MONOLITH_WIDTH,
} from '../game/scene/monoliths';
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
    monolithHeight: number;
    monolithWidth: number;
    monolithDepth: number;
    monolithGap: number;
    monolithBelow: number;
    monolithSpacingCalm: number;
    monolithSpacingIntense: number;
    monolithSeam: number;
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
        monolithHeight: MONOLITH_HEIGHT,
        monolithWidth: MONOLITH_WIDTH,
        monolithDepth: MONOLITH_DEPTH,
        monolithGap: MONOLITH_GAP,
        monolithBelow: MONOLITH_BELOW,
        monolithSpacingCalm: MONOLITH_SPACING_CALM,
        monolithSpacingIntense: MONOLITH_SPACING_INTENSE,
        monolithSeam: MONOLITH_SEAM_INTENSITY,
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
        '// game/scene/monoliths.tsx',
        `export const MONOLITH_HEIGHT = ${ n( t.monolithHeight ) };`,
        `export const MONOLITH_WIDTH = ${ n( t.monolithWidth ) };`,
        `export const MONOLITH_DEPTH = ${ n( t.monolithDepth ) };`,
        `export const MONOLITH_GAP = ${ n( t.monolithGap ) };`,
        `export const MONOLITH_BELOW = ${ n( t.monolithBelow ) };`,
        `export const MONOLITH_SPACING_CALM = ${ n( t.monolithSpacingCalm ) };`,
        `export const MONOLITH_SPACING_INTENSE = ${ n( t.monolithSpacingIntense ) };`,
        '',
        `export const MONOLITH_SEAM_INTENSITY = ${ n( t.monolithSeam ) };`,
    ].join( '\n' );
}
