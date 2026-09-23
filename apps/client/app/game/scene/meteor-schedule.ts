import { HALF_WIDTH } from '@slur/shared';
import { hash01 } from './asteroid-field';

export const STRIKE_SPACING = 220;
export const STRIKE_START = 400;
export const STRIKE_VARIANTS = 3;

const SALT = 0x6d3e_71a9;
const EDGE = 6;
const DEG = Math.PI / 180;
const ELEVATION: readonly [ number, number ] = [ 18 * DEG, 50 * DEG ];
const BEARING: readonly [ number, number ] = [ 10 * DEG, 55 * DEG ];
const SIZE: readonly [ number, number ] = [ 2.2, 5.2 ];
const Z_JITTER = 0.6;

export interface Strike {
    slot: number;
    x: number;
    z: number;
    size: number;
    fromX: number;
    fromY: number;
    fromZ: number;
    spin: number;
    variant: number;
}

function lerp( range: readonly [ number, number ], t: number ): number {
    return range[ 0 ] + ( range[ 1 ] - range[ 0 ] ) * t;
}

export function strikeAt( slot: number, chance: number ): Strike | null {
    const z0 = slot * STRIKE_SPACING;
    if ( z0 < STRIKE_START ) return null;
    const seed = Math.imul( slot + 7, 0x9e37_79b1 ) ^ SALT;
    if ( hash01( seed, 1 ) >= chance ) return null;
    const side = hash01( seed, 4 ) < 0.5 ? -1 : 1;
    const elevation = lerp( ELEVATION, hash01( seed, 5 ) );
    const bearing = lerp( BEARING, hash01( seed, 6 ) );
    return {
        slot,
        x: ( hash01( seed, 3 ) * 2 - 1 ) * ( HALF_WIDTH - EDGE ),
        z: z0 + ( hash01( seed, 2 ) - 0.5 ) * STRIKE_SPACING * Z_JITTER,
        size: lerp( SIZE, hash01( seed, 7 ) ),
        fromX: side * Math.cos( elevation ) * Math.cos( bearing ),
        fromY: Math.sin( elevation ),
        fromZ: Math.cos( elevation ) * Math.sin( bearing ),
        spin: ( hash01( seed, 9 ) - 0.5 ) * 4,
        variant: Math.min( STRIKE_VARIANTS - 1, Math.floor( hash01( seed, 8 ) * STRIKE_VARIANTS ) ),
    };
}

export function strikeWindow( slot: number ): number {
    return slot * STRIKE_SPACING + ( STRIKE_SPACING * Z_JITTER ) / 2;
}
