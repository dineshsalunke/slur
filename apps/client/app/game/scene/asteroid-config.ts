import { HALF_WIDTH } from '@slur/shared';
import { RAIL_W } from './track-geometry';

export type AsteroidBandName = 'flank' | 'mid' | 'belt';

export const CORRIDOR_CLEARANCE = HALF_WIDTH + RAIL_W + 36;

export interface AsteroidBand {
    key: number;
    name: AsteroidBandName;
    innerRadius: number;
    outerRadius: number;
    minAngle: number;
    maxAngle: number;
    minSize: number;
    maxSize: number;
    spacing: number;
    density: number;
    variants: number;
    detail: number;
    limit: number;
}

const DEG = Math.PI / 180;

export const FLANK_BAND: AsteroidBand = {
    key: 0,
    name: 'flank',
    innerRadius: 90,
    outerRadius: 180,
    minAngle: 0 * DEG,
    maxAngle: 35 * DEG,
    minSize: 4,
    maxSize: 18,
    spacing: 12,
    density: 1,
    variants: 3,
    detail: 9,
    limit: 176,
};

export const MID_BAND: AsteroidBand = {
    key: 1,
    name: 'mid',
    innerRadius: 180,
    outerRadius: 400,
    minAngle: 10 * DEG,
    maxAngle: 60 * DEG,
    minSize: 15,
    maxSize: 60,
    spacing: 16,
    density: 1,
    variants: 2,
    detail: 7,
    limit: 132,
};

export const BELT_BAND: AsteroidBand = {
    key: 2,
    name: 'belt',
    innerRadius: 400,
    outerRadius: 700,
    minAngle: 25 * DEG,
    maxAngle: 85 * DEG,
    minSize: 50,
    maxSize: 180,
    spacing: 20,
    density: 1,
    variants: 2,
    detail: 6,
    limit: 112,
};

export const ASTEROID_BANDS: readonly AsteroidBand[] = [ FLANK_BAND, MID_BAND, BELT_BAND ];

export const ROCK_FAR = 950;

export function bandAhead( band: AsteroidBand, ahead: number ): number {
    const reach = band.outerRadius + band.maxSize / 2;
    return Math.min( ahead, Math.sqrt( Math.max( 0, ROCK_FAR * ROCK_FAR - reach * reach ) ) );
}
