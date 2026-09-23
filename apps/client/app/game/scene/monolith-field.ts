import { intensityAt, SEG_LEN, START_SAFE } from '@slur/shared';
import type { PillarFieldConfig } from './monolith-config';

export interface MonolithPlacement {
    z: number;
    side: number;
}

export const MIN_SPACING = 8;

export function monolithSpacing( intensity: number, calm: number, intense: number ): number {
    return Math.max( MIN_SPACING, calm + ( intense - calm ) * intensity );
}

export function pillarRows( finishZ: number, config: PillarFieldConfig ): number[] {
    const length = Math.max( 1, Math.round( finishZ / SEG_LEN ) );
    const rows: number[] = [];
    for ( let z = START_SAFE * SEG_LEN; z < finishZ; ) {
        rows.push( z );
        z += monolithSpacing(
            intensityAt( Math.floor( z / SEG_LEN ), length ),
            config.spacingCalm,
            config.spacingIntense,
        );
    }
    return rows;
}

export function pillarField( finishZ: number, config: PillarFieldConfig ): MonolithPlacement[] {
    return pillarRows( finishZ, config ).flatMap( ( z ) => [
        { z, side: -1 },
        { z, side: 1 },
    ] );
}
