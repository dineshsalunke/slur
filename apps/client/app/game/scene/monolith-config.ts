export type MonolithShapeName = 'box' | 'obelisk';

export type SeamFace = 'inner' | 'outer';

export type SeamAlign = 'center' | 'near' | 'far';

export interface MonolithSurface {
    color: string;
    roughness: number;
    metalness: number;
    envMapIntensity: number;
}

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
    surface: MonolithSurface;
    seam: MonolithSeamConfig;
}

export interface MonolithFieldConfig {
    shapes: readonly MonolithShapeName[];
    spacingCalm: number;
    spacingIntense: number;
}

export const GRAPHITE_SURFACE: MonolithSurface = {
    color: '#333d47',
    roughness: 0.62,
    metalness: 0.3,
    envMapIntensity: 1.6,
};

export const EDGE_SEAM: MonolithSeamConfig = {
    face: 'inner',
    align: 'near',
    width: 0.5,
    proud: 0.5,
    color: '#0b0d0f',
    emissive: '#F59A24',
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
    surface: GRAPHITE_SURFACE,
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
