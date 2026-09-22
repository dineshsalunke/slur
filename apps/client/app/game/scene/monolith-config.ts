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

export interface MonolithFieldConfig {
    shapes: readonly MonolithShapeName[];
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
    shapes: [ 'box' ],
    spacingCalm: 400,
    spacingIntense: 200,
};
