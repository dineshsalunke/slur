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
    innerRadius: 110,
    outerRadius: 200,
    minAngle: 0 * DEG,
    maxAngle: 35 * DEG,
    minSize: 10,
    maxSize: 50,
    spacing: 60,
    density: 0.55,
    variants: 3,
    detail: 2,
    limit: 32,
};

export const MID_BAND: AsteroidBand = {
    key: 1,
    name: 'mid',
    innerRadius: 240,
    outerRadius: 520,
    minAngle: 10 * DEG,
    maxAngle: 60 * DEG,
    minSize: 50,
    maxSize: 200,
    spacing: 40,
    density: 0.8,
    variants: 2,
    detail: 1,
    limit: 64,
};

export const BELT_BAND: AsteroidBand = {
    key: 2,
    name: 'belt',
    innerRadius: 500,
    outerRadius: 700,
    minAngle: 25 * DEG,
    maxAngle: 85 * DEG,
    minSize: 200,
    maxSize: 400,
    spacing: 20,
    density: 1,
    variants: 1,
    detail: 0,
    limit: 160,
};

export const ASTEROID_BANDS: readonly AsteroidBand[] = [ FLANK_BAND, MID_BAND, BELT_BAND ];
