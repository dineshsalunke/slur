import { ACCENT_ANCHOR } from './accent';

export type SeamFace = 'inner' | 'outer';

export type SeamAlign = 'center' | 'near' | 'far';

export interface MonolithSeamConfig {
    face: SeamFace;
    align: SeamAlign;
    width: number;
    proud: number;
    color: string;
    emissive: string;
    intensity: number;
}

export interface MonolithShapeConfig {
    taper: number;
    chamfer: number;
    width: number;
    depth: number;
    height: number;
    below: number;
    gap: number;
    seam: MonolithSeamConfig;
}

export interface PillarFieldConfig {
    spacingCalm: number;
    spacingIntense: number;
}

export const EDGE_SEAM: MonolithSeamConfig = {
    face: 'inner',
    align: 'near',
    width: 0.5,
    proud: 0.5,
    color: '#0b0d0f',
    emissive: ACCENT_ANCHOR,
    intensity: 2,
};

export const PILLAR: MonolithShapeConfig = {
    taper: 1,
    chamfer: 0.45,
    width: 12,
    depth: 12,
    height: 50,
    below: 60,
    gap: 0,
    seam: EDGE_SEAM,
};

export const PILLAR_FIELD: PillarFieldConfig = {
    spacingCalm: 400,
    spacingIntense: 200,
};
