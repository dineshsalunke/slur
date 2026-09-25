import { TRACK_CONTRACT } from '../../constants.js';

export type GrooveBand = 'low' | 'mid' | 'high';

export const GROOVE_BANDS: readonly GrooveBand[] = [ 'low', 'mid', 'high' ];

export interface BandGrammar {
    gapBeats: readonly number[];
    strafes: number;
    jumps: number;
    dx: readonly number[];
}

export interface GrooveGrammar {
    beatS: number;
    beatsPerBar: number;
    dxBin: number;
    alternate: { switched: number; kept: number };
    bands: Readonly< Record< GrooveBand, BandGrammar > >;
    sectionBars: Readonly< Record< GrooveBand, Readonly< Record< number, number > > > >;
    sectionNext: Readonly< Record< GrooveBand, Readonly< Partial< Record< GrooveBand, number > > > > >;
}

export const GROOVE_GRAMMAR: GrooveGrammar = {
    beatS: 0.47992321228603424,
    beatsPerBar: 4,
    dxBin: 4,
    alternate: { switched: 196, kept: 71 },
    bands: {
        low: { gapBeats: [ 20, 50, 4, 1 ], strafes: 73, jumps: 2, dx: [ 1, 7, 7, 13, 16, 13, 7, 5, 2, 2 ] },
        mid: { gapBeats: [ 70, 82, 8, 8 ], strafes: 171, jumps: 4, dx: [ 4, 26, 27, 27, 17, 23, 21, 10, 3, 9 ] },
        high: { gapBeats: [ 8, 38, 5, 8 ], strafes: 28, jumps: 33, dx: [ 1, 1, 5, 1, 5, 2, 3, 2, 4, 3 ] },
    },
    sectionBars: {
        low: { 4: 2, 8: 2 },
        mid: { 4: 3, 8: 2, 16: 1 },
        high: { 8: 1, 12: 1, 16: 1 },
    },
    sectionNext: {
        low: { mid: 3, high: 1 },
        mid: { low: 3, high: 2 },
        high: { mid: 3 },
    },
};

export const GROOVE_BEAT_Z = TRACK_CONTRACT.registerCruise * GROOVE_GRAMMAR.beatS;

export function pickWeighted( weights: readonly number[], r: number ): number {
    const total = weights.reduce( ( a, b ) => a + b, 0 );
    let acc = r * total;
    for ( let k = 0; k < weights.length; k++ ) {
        acc -= weights[ k ];
        if ( acc < 0 ) return k;
    }
    return weights.length - 1;
}

export function pickKey< K extends string | number >(
    table: Readonly< Partial< Record< K, number > > >,
    r: number,
): K {
    const keys = Object.keys( table ) as K[];
    return keys[
        pickWeighted(
            keys.map( ( k ) => table[ k ] ?? 0 ),
            r,
        )
    ];
}

export function switchChance( g: GrooveGrammar = GROOVE_GRAMMAR ): number {
    return g.alternate.switched / ( g.alternate.switched + g.alternate.kept );
}

export function jumpChance( band: GrooveBand, g: GrooveGrammar = GROOVE_GRAMMAR ): number {
    const b = g.bands[ band ];
    return b.jumps / ( b.jumps + b.strafes );
}
