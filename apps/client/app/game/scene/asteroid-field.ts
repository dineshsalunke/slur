import type { AsteroidBand } from './asteroid-config';

const TAU = Math.PI * 2;

const SIDES = [ -1, 1 ] as const;

const STRETCH_FAMILIES = [
    [ 0.95, 0.88, 1 ],
    [ 1, 0.33, 0.36 ],
    [ 1, 0.31, 0.89 ],
] as const;

export interface AsteroidPlacement {
    x: number;
    y: number;
    z: number;
    size: number;
    stretch: readonly [ number, number, number ];
    rotation: readonly [ number, number, number ];
    variant: number;
}

export function hash01( seed: number, salt: number ): number {
    let h = Math.imul( seed ^ Math.imul( salt, 0x9e37_79b1 ), 0x85eb_ca6b );
    h ^= h >>> 13;
    h = Math.imul( h, 0xc2b2_ae35 );
    return ( ( h ^ ( h >>> 16 ) ) >>> 0 ) / 0x1_0000_0000;
}

function lerp( a: number, b: number, t: number ): number {
    return a + ( b - a ) * t;
}

export function asteroidSlotSeed( key: number, slot: number, side: number ): number {
    const a = Math.imul( slot + 1, 0x27d4_eb2d );
    const b = Math.imul( key * 2 + ( side > 0 ? 1 : 0 ) + 3, 0x1656_67b1 );
    return ( a ^ b ) | 0;
}

function pick< T >( items: readonly T[], t: number ): T {
    return items[ Math.min( items.length - 1, Math.floor( t * items.length ) ) ];
}

function placeAsteroid( band: AsteroidBand, seed: number, slot: number, side: number ): AsteroidPlacement {
    const radius = lerp( band.innerRadius, band.outerRadius, hash01( seed, 0x2 ) );
    const angle = lerp( band.minAngle, band.maxAngle, hash01( seed, 0x3 ) );
    const jitter = ( hash01( seed, 0x5 ) - 0.5 ) * band.spacing;
    const vertical = hash01( seed, 0xa ) < 0.5 ? -1 : 1;

    return {
        x: side * Math.cos( angle ) * radius,
        y: vertical * Math.sin( angle ) * radius,
        z: slot * band.spacing + jitter,
        size: lerp( band.minSize, band.maxSize, hash01( seed, 0x4 ) ),
        stretch: pick( STRETCH_FAMILIES, hash01( seed, 0xf ) ),
        rotation: [ hash01( seed, 0x6 ) * TAU, hash01( seed, 0x7 ) * TAU, hash01( seed, 0x8 ) * TAU ],
        variant: Math.min( band.variants - 1, Math.floor( hash01( seed, 0x9 ) * band.variants ) ),
    };
}

export function asteroidField( band: AsteroidBand, z0: number, z1: number ): AsteroidPlacement[] {
    const out: AsteroidPlacement[] = [];
    const first = Math.ceil( z0 / band.spacing );
    const last = Math.floor( z1 / band.spacing );

    for ( let slot = first; slot <= last; slot++ ) {
        for ( const side of SIDES ) {
            const seed = asteroidSlotSeed( band.key, slot, side );
            if ( hash01( seed, 0x1 ) > band.density ) continue;
            out.push( placeAsteroid( band, seed, slot, side ) );
        }
    }
    return out.sort( ( a, b ) => a.z - b.z );
}

export function asteroidClearance( p: AsteroidPlacement ): number {
    return Math.hypot( p.x, p.y ) - p.size / 2;
}
