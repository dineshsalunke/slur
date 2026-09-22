import { BLOCK_MAX_LANES, CELL, FLICK_WIDTH, WALL_NOISE_FZ_LANE, WALL_NOISE_FZ_SEG } from '../constants.js';
import { blockZSpan } from './block-depth.js';
import { openCenterX } from './clearance.js';
import { type Band, bandAt } from './corridor.js';
import { gapBlocks } from './gap-blocks.js';
import { crackCovering, crackFloors, gapFloors, gapOpens } from './gaps.js';
import { flickRate, intensityAt, spacingSegments, wallDensity } from './intensity.js';
import { valueNoise2D } from './noise.js';
import { hash2, mulberry32 } from './rng.js';
import {
    type Anchor,
    BLOCK_HEIGHT,
    type Block,
    FULL_DENSITY,
    fullFloor,
    HALF_WIDTH,
    isHole,
    LANES,
    LEAD_SEGMENTS,
    MIN_LANE,
    PICKUP_SPACING,
    type ProcgenDescriptor,
    SEG_LEN,
    type Segment,
    START_SAFE,
    segIndexForZ,
    TRACK_SEGMENTS,
    type Track,
    type TrackDensity,
} from './space.js';

const SALT_WALL = 0x51ed270b | 0;
const SALT_FLICK = 0x7a1c9e33 | 0;

interface Flick {
    lo: number;
    hi: number;
}

function laneState( seed: number, i: number, lane: number, band: Band, flick: Flick | null, density: number ): 0 | 1 {
    if ( lane >= band.lo && lane <= band.hi ) {
        return flick && lane >= flick.lo && lane <= flick.hi ? 1 : 0;
    }
    if ( band.pinched ) return 1;
    const wall = valueNoise2D( ( seed ^ SALT_WALL ) | 0, lane / WALL_NOISE_FZ_LANE, i / WALL_NOISE_FZ_SEG ) < density;
    return wall ? 1 : 0;
}

function flickRolled( seed: number, i: number, length: number, blocks: number ): boolean {
    if ( i < START_SAFE || i >= length ) return false;
    return mulberry32( hash2( ( seed ^ SALT_FLICK ) | 0, i ) )() < flickRate( intensityAt( i, length ) ) * blocks;
}

function flickOpens( seed: number, i: number, length: number, blocks: number ): boolean {
    if ( ! flickRolled( seed, i, length, blocks ) ) return false;
    const back = spacingSegments( intensityAt( i, length ) );
    for ( let p = 1; p <= back; p++ ) {
        if ( flickRolled( seed, i - p, length, blocks ) ) return false;
    }
    return true;
}

function flickAt(
    seed: number,
    i: number,
    length: number,
    band: Band,
    blocks: number,
    density: TrackDensity,
): Flick | null {
    if ( band.pinched ) return null;
    if ( ! flickOpens( seed, i, length, blocks ) ) return null;
    const back = spacingSegments( intensityAt( i, length ) );
    for ( let p = 1; p <= back; p++ ) {
        if ( gapOpens( seed, i - p, length, density ) ) return null;
    }
    const minGapLanes = MIN_LANE / CELL;
    if ( band.hi - band.lo + 1 - FLICK_WIDTH < minGapLanes ) return null;
    const fromLeft = mulberry32( hash2( ( seed ^ SALT_FLICK ) | 0, i * 2 + 1 ) )() < 0.5;
    return fromLeft ? { lo: band.lo, hi: band.lo + FLICK_WIDTH - 1 } : { lo: band.hi - FLICK_WIDTH + 1, hi: band.hi };
}

function buildWalls(
    seed: number,
    i: number,
    band: Band,
    flick: Flick | null,
    density: number,
    z0: number,
    intensity: number,
): Block[] {
    const blocks: Block[] = [];
    let runStart = 0;
    let runState: 0 | 1 = 0;
    const flush = ( endLane: number ): void => {
        const [ bz0, bz1 ] = band.pinched
            ? [ z0, z0 + SEG_LEN ]
            : blockZSpan( seed, i, runStart, z0, SEG_LEN, intensity );
        blocks.push( {
            x0: -HALF_WIDTH + runStart * CELL,
            x1: -HALF_WIDTH + ( endLane + 1 ) * CELL,
            y0: 0,
            y1: BLOCK_HEIGHT,
            z0: bz0,
            z1: bz1,
        } );
    };
    for ( let lane = 0; lane < LANES; lane++ ) {
        const st = laneState( seed, i, lane, band, flick, density );
        if ( st !== runState || ( runState !== 0 && lane - runStart >= BLOCK_MAX_LANES ) ) {
            if ( runState !== 0 ) flush( lane - 1 );
            runState = st;
            runStart = lane;
        }
    }
    if ( runState !== 0 ) flush( LANES - 1 );
    return blocks;
}

function buildSegment( seed: number, i: number, length: number, density: TrackDensity ): Segment {
    const z0 = i * SEG_LEN;
    const z1 = z0 + SEG_LEN;
    const base = { index: i, z0, z1, blocks: [] as Block[], isFinish: false };

    if ( i >= length ) return { ...base, kind: 'finish', floors: fullFloor( 0 ), isFinish: true };
    if ( i < -LEAD_SEGMENTS ) return { ...base, kind: 'gap', floors: [] };
    if ( i < START_SAFE ) return { ...base, kind: 'plain', floors: fullFloor( 0 ) };

    const intensity = intensityAt( i, length );

    const crack = crackCovering( seed, i, length, density );
    if ( crack ) {
        const floors = crackFloors( crack );
        return { ...base, kind: 'gap', floors, blocks: gapBlocks( seed, i, intensity, floors, z0, z1, density ) };
    }

    if ( gapOpens( seed, i, length, density ) ) {
        const floors = gapFloors( seed, i, length, z0 );
        return { ...base, kind: 'gap', floors, blocks: gapBlocks( seed, i, intensity, floors, z0, z1, density ) };
    }

    const band = bandAt( seed, i, length, density );
    const flick = flickAt( seed, i, length, band, density.blocks, density );
    const blocks = buildWalls( seed, i, band, flick, wallDensity( intensity ) * density.blocks, z0, intensity );

    return { ...base, kind: blocks.length > 0 ? 'block' : 'plain', floors: fullFloor( 0 ), blocks };
}

function pickupAnchors( length: number, segmentAt: ( i: number ) => Segment ): Anchor[] {
    const out: Anchor[] = [];
    for ( let seg = START_SAFE; seg < length; seg += PICKUP_SPACING ) {
        const s = segmentAt( seg );
        if ( isHole( s ) ) continue;
        const z = seg * SEG_LEN + SEG_LEN / 2;
        out.push( { id: String( seg ), kind: 'pickup', x: openCenterX( s ), y: 0, z } );
    }
    return out;
}

export function makeProcgenTrack( d: ProcgenDescriptor ): Track {
    const seed = d.seed;
    const length = d.length || TRACK_SEGMENTS;
    const density: TrackDensity = {
        blocks: d.blockDensity ?? FULL_DENSITY.blocks,
        gaps: d.gapChance ?? FULL_DENSITY.gaps,
    };
    const segmentAt = ( i: number ): Segment => buildSegment( seed, i, length, density );
    return {
        finishZ: length * SEG_LEN,
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ),
        anchors: pickupAnchors( length, segmentAt ),
    };
}
