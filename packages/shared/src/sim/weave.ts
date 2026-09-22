import {
    CELL,
    deriveNodePeriod,
    deriveWeaveCurvatureCap,
    deriveWeavePeriod,
    deriveWeaveSlopeCap,
    WEAVE_CARRIER_BUDGET,
    WEAVE_NOISE_FRAC,
} from '../constants.js';
import { ALL_CLASS_TUNINGS } from '../ship-classes.js';
import { smoothstep, tri, valueNoise1D } from './noise.js';
import { LANES, ZCELLS } from './space.js';

export const WEAVE_AMP_LANES = LANES;
export const SLOPE_CAP = deriveWeaveSlopeCap( ALL_CLASS_TUNINGS );
export const CURV_CAP = deriveWeaveCurvatureCap( ALL_CLASS_TUNINGS, CELL );
export const FZ_ROWS = deriveNodePeriod( SLOPE_CAP, CURV_CAP, WEAVE_AMP_LANES );
export const WEAVE_PERIOD_ROWS = deriveWeavePeriod( SLOPE_CAP, CURV_CAP, WEAVE_AMP_LANES, WEAVE_CARRIER_BUDGET );

const SALT_LINE_A = 0x1234567 | 0;
const SALT_LINE_B = 0x2b3c4d5 | 0;

export function rowGlobal( i: number, r: number ): number {
    return i * ZCELLS + r;
}

function weavePhaseRows( seed: number ): number {
    return valueNoise1D( ( seed ^ SALT_LINE_A ) | 0, 0.5 ) * WEAVE_PERIOD_ROWS;
}

export function weaveRaw( seed: number, row: number ): number {
    const phase = ( row + weavePhaseRows( seed ) ) / WEAVE_PERIOD_ROWS;
    const carrier = smoothstep( ( tri( phase ) + 1 ) / 2 );
    const perturb = valueNoise1D( ( seed ^ SALT_LINE_B ) | 0, row / FZ_ROWS );
    const v = ( 1 - WEAVE_NOISE_FRAC ) * carrier + WEAVE_NOISE_FRAC * perturb;
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function weaveLineLanes( seed: number, row: number ): number {
    return weaveRaw( seed, row ) * WEAVE_AMP_LANES;
}
