import {
    CORRIDOR_W_MIN,
    CORRIDOR_W_START,
    DEFAULT_TUNING,
    demandSpacingSegments,
    FLICK_RATE_MAX,
    FLICK_RATE_START,
    GAP_P_MAX,
    GAP_P_START,
    GAP_REST_FLOOR,
    REST_INTENSITY,
    SECTIONS,
    WALL_DENSITY_MAX,
    WALL_DENSITY_START,
} from '../constants.js';
import { smoothstep } from './noise.js';
import { clamp, LANES, lerp, SEG_LEN, START_SAFE } from './space.js';

const SECTION_BOUNDS = ( () => {
    const total = SECTIONS.reduce( ( sum, s ) => sum + s.weight, 0 );
    let acc = 0;
    return SECTIONS.map( ( s ) => {
        const f0 = acc / total;
        acc += s.weight;
        return { f0, f1: acc / total, i0: s.i0, i1: s.i1 };
    } );
} )();

export function intensityAt( i: number, length: number ): number {
    if ( i < START_SAFE ) return 0;
    const span = length - START_SAFE;
    const pos = span > 0 ? clamp( ( i - START_SAFE ) / span, 0, 1 ) : 0;
    let s = SECTION_BOUNDS[ SECTION_BOUNDS.length - 1 ];
    for ( const b of SECTION_BOUNDS ) {
        if ( pos >= b.f0 && pos < b.f1 ) {
            s = b;
            break;
        }
    }
    const t = s.f1 > s.f0 ? ( pos - s.f0 ) / ( s.f1 - s.f0 ) : 1;
    return clamp( lerp( s.i0, s.i1, smoothstep( clamp( t, 0, 1 ) ) ), 0, 1 );
}

export function restScale( intensity: number ): number {
    return clamp( intensity / REST_INTENSITY, 0, 1 );
}

export function corridorWidthLanes( intensity: number ): number {
    const w = Math.round( lerp( CORRIDOR_W_START, CORRIDOR_W_MIN, intensity ) );
    return clamp( w, CORRIDOR_W_MIN, LANES );
}

export function wallDensity( intensity: number ): number {
    return lerp( WALL_DENSITY_START, WALL_DENSITY_MAX, intensity ) * restScale( intensity );
}

export function gapProb( intensity: number ): number {
    const rest = GAP_REST_FLOOR + ( 1 - GAP_REST_FLOOR ) * restScale( intensity );
    return lerp( GAP_P_START, GAP_P_MAX, intensity ) * rest;
}

export function flickRate( intensity: number ): number {
    return lerp( FLICK_RATE_START, FLICK_RATE_MAX, intensity ) * restScale( intensity );
}

export function spacingSegments( intensity: number ): number {
    return demandSpacingSegments( intensity, SEG_LEN, DEFAULT_TUNING.maxCruise );
}
