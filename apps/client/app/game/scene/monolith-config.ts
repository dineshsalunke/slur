import { ACCENT_ANCHOR } from './accent';

export type MonolithShapeName = 'box' | 'obelisk';

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

export interface MonolithRange {
    min: number;
    max: number;
}

export interface MonolithFieldConfig {
    shapes: readonly MonolithShapeName[];
    spacingCalm: number;
    spacingIntense: number;
    spacing: MonolithRange;
    width: MonolithRange;
    height: MonolithRange;
    depth: MonolithRange;
    sidePhase: number;
    dropRate: number;
    pushMax: number;
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

export const BOX_MONOLITH: MonolithShapeConfig = {
    taper: 1,
    chamfer: 0.45,
    width: 12,
    depth: 12,
    height: 50,
    below: 60,
    gap: 0,
    seam: EDGE_SEAM,
};

export const MONOLITH_SHAPES: Record< MonolithShapeName, MonolithShapeConfig > = {
    box: BOX_MONOLITH,
    obelisk: { ...BOX_MONOLITH, taper: 0.62 },
};

export const MONOLITH_FIELD: MonolithFieldConfig = {
    shapes: [ 'box', 'obelisk' ],
    spacingCalm: 400,
    spacingIntense: 200,
    spacing: { min: 0.55, max: 1.6 },
    width: { min: 0.55, max: 1.9 },
    height: { min: 0.5, max: 2.2 },
    depth: { min: 0.6, max: 1.8 },
    sidePhase: 0.47,
    dropRate: 0.14,
    pushMax: 30,
};
