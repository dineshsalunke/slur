import { CELL, SECTIONS } from '../constants.js';
import { bandAt } from '../sim/corridor.js';
import { intensityAt } from '../sim/intensity.js';
import {
    FULL_DENSITY,
    HALF_WIDTH,
    type ProcgenDescriptor,
    type Segment,
    START_SAFE,
    TRACK_SEGMENTS,
    type TrackDensity,
} from '../sim/space.js';

export interface PacingSection {
    name: string;
    i0: number;
    i1: number;
    from: number;
    to: number;
}

export interface PacingBand {
    x0: number;
    x1: number;
    pinched: boolean;
}

export interface PacingIntent {
    intensity: Float32Array;
    sections: PacingSection[];
    bands: Array< PacingBand | null >;
}

export function sectionSpans( length: number ): PacingSection[] {
    const total = SECTIONS.reduce( ( sum, s ) => sum + s.weight, 0 );
    const span = length - START_SAFE;
    const out: PacingSection[] = [];
    let acc = 0;
    for ( const s of SECTIONS ) {
        const i0 = Math.ceil( START_SAFE + ( acc / total ) * span );
        acc += s.weight;
        const i1 = Math.min( length, Math.ceil( START_SAFE + ( acc / total ) * span ) ) - 1;
        out.push( { name: s.name, i0, i1, from: s.i0, to: s.i1 } );
    }
    return out;
}

export function procgenIntent( d: ProcgenDescriptor, segments: Segment[] ): PacingIntent {
    const length = d.length || TRACK_SEGMENTS;
    const density: TrackDensity = {
        blocks: d.blockDensity ?? FULL_DENSITY.blocks,
        gaps: d.gapChance ?? FULL_DENSITY.gaps,
    };
    const intensity = new Float32Array( length );
    const bands: Array< PacingBand | null > = [];
    for ( let i = 0; i < length; i++ ) {
        intensity[ i ] = intensityAt( i, length );
        const seg = segments[ i ];
        if ( i < START_SAFE || seg === undefined || seg.kind === 'gap' ) {
            bands.push( null );
            continue;
        }
        const b = bandAt( d.seed, i, length, density );
        bands.push( { x0: -HALF_WIDTH + b.lo * CELL, x1: -HALF_WIDTH + ( b.hi + 1 ) * CELL, pinched: b.pinched } );
    }
    return { intensity, sections: sectionSpans( length ), bands };
}
