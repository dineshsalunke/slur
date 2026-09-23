import type { PillarFieldConfig } from './monolith-config';
import { intensityAtZ, type MonolithPlacement, pillarPairs, pillarRows } from './monolith-field';
import { ARCH_FRAME, type FramePlacement } from './monolith-frame';

export const ARCH_FRACTIONS: readonly number[] = [ 0.25, 0.5, 0.75 ];

export const ARCH_GROWTH = 0.4;

export interface MonolithLayout {
    pillars: MonolithPlacement[];
    arches: FramePlacement[];
}

export function archRows( finishZ: number, rows: readonly number[], fractions = ARCH_FRACTIONS ): number[] {
    const taken = new Set< number >();
    for ( const fraction of fractions ) {
        const target = fraction * finishZ;
        let best: number | undefined;
        for ( const z of rows ) {
            if ( taken.has( z ) ) continue;
            if ( best === undefined || Math.abs( z - target ) < Math.abs( best - target ) ) best = z;
        }
        if ( best !== undefined ) taken.add( best );
    }
    return [ ...taken ].sort( ( a, b ) => a - b );
}

export function archHeight( z: number, finishZ: number, base = ARCH_FRAME.height ): number {
    return base * ( 1 + ARCH_GROWTH * intensityAtZ( z, finishZ ) );
}

export function monolithLayout( finishZ: number, config: PillarFieldConfig ): MonolithLayout {
    const rows = pillarRows( finishZ, config );
    const arched = new Set( archRows( finishZ, rows ) );
    return {
        pillars: pillarPairs( rows.filter( ( z ) => ! arched.has( z ) ) ),
        arches: [ ...arched ].map( ( z ) => ( { z, height: archHeight( z, finishZ ) } ) ),
    };
}
