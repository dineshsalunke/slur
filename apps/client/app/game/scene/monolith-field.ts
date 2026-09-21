import { intensityAt, SEG_LEN, START_SAFE } from '@slur/shared';

export interface MonolithPlacement {
    z: number;
    side: number;
}

export const MIN_SPACING = 8;

export function monolithSpacing( intensity: number, calm: number, intense: number ): number {
    return Math.max( MIN_SPACING, calm + ( intense - calm ) * intensity );
}

export function monolithField( finishZ: number, calm: number, intense: number ): MonolithPlacement[] {
    const length = Math.max( 1, Math.round( finishZ / SEG_LEN ) );
    const placements: MonolithPlacement[] = [];
    let z = START_SAFE * SEG_LEN;
    while ( z < finishZ ) {
        placements.push( { z, side: -1 }, { z, side: 1 } );
        z += monolithSpacing( intensityAt( Math.floor( z / SEG_LEN ), length ), calm, intense );
    }
    return placements;
}
