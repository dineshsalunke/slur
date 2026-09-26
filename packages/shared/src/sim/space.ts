import { CELL } from '../constants.js';

export const SEG_LEN = 20;
export const TRACK_SEGMENTS = 400;
export const START_SAFE = 6;
export const LEAD_SEGMENTS = 1;
export const HALF_WIDTH = 48;
export const LANES = ( 2 * HALF_WIDTH ) / CELL;
export const ZCELLS = SEG_LEN / CELL;
export const MIN_LANE = 2 * CELL;
export const BLOCK_HEIGHT = 8;

export interface FloorSpan {
    x0: number;
    x1: number;
    y: number;
    z0?: number;
    z1?: number;
}

export interface BlockBox {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    z0: number;
    z1: number;
}

export type BlockKind = 'sealed' | 'fractured';

export interface Block extends BlockBox {
    id: number;
    kind: BlockKind;
}

export const BLOCK_ID_STRIDE = 64;

export function blockId( segIndex: number, k: number ): number {
    return segIndex * BLOCK_ID_STRIDE + k;
}

export type SegmentKind = 'plain' | 'block' | 'gap' | 'finish';

export interface Segment {
    index: number;
    z0: number;
    z1: number;
    kind: SegmentKind;
    floors: FloorSpan[];
    blocks: Block[];
    isFinish: boolean;
}

export interface TrackDensity {
    blocks: number;
    gaps: number;
}

export const FULL_DENSITY: TrackDensity = { blocks: 1, gaps: 1 };

export function lerp( a: number, b: number, t: number ): number {
    return a + ( b - a ) * t;
}

export function clamp( v: number, lo: number, hi: number ): number {
    return v < lo ? lo : v > hi ? hi : v;
}

export function laneOf( x: number ): number {
    return Math.round( ( x + HALF_WIDTH ) / CELL );
}

export function spanZ0( seg: Segment, f: FloorSpan ): number {
    return f.z0 ?? seg.z0;
}

export function spanZ1( seg: Segment, f: FloorSpan ): number {
    return f.z1 ?? seg.z1;
}

export function isFullSpan( f: FloorSpan ): boolean {
    return f.z0 === undefined && f.z1 === undefined;
}

export function spanHasZ( seg: Segment, f: FloorSpan, z: number ): boolean {
    return z >= spanZ0( seg, f ) - 1e-4 && z <= spanZ1( seg, f ) + 1e-4;
}

export function spanOverlapsZ( seg: Segment, f: FloorSpan, z0: number, z1: number ): boolean {
    return z1 > spanZ0( seg, f ) + 1e-4 && z0 < spanZ1( seg, f ) - 1e-4;
}

export function isHole( seg: Segment ): boolean {
    return ! seg.floors.some( isFullSpan );
}

export function segIndexForZ( z: number ): number {
    return Math.floor( z / SEG_LEN );
}

export interface Anchor {
    id: string;
    kind: string;
    x: number;
    y: number;
    z: number;
    params?: unknown;
}

export interface Track {
    finishZ: number;
    segmentAt( i: number ): Segment;
    segmentAtZ( z: number ): Segment;
    anchors: Anchor[];
}

export interface ProcgenDescriptor {
    kind: 'procgen';
    seed: number;
    tier: number;
    length: number;
    blockDensity?: number;
    gapChance?: number;
    gen?: TrackGen;
}

export const TRACK_GENS = [ 'weave', 'score', 'groove', 'phrase' ] as const;

export type TrackGen = ( typeof TRACK_GENS )[ number ];

export const TRACK_GEN_SEGMENTS: Readonly< Record< TrackGen, number > > = {
    weave: TRACK_SEGMENTS,
    score: TRACK_SEGMENTS,
    groove: TRACK_SEGMENTS,
    phrase: 600,
};

export const DEFAULT_TRACK_GEN: TrackGen = 'groove';

export function isTrackGen( v: unknown ): v is TrackGen {
    return TRACK_GENS.includes( v as TrackGen );
}

export function fullFloor( y: number ): FloorSpan[] {
    return [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y } ];
}
