import { EDGE_SEAM, type MonolithShapeConfig } from './monolith-config';
import { bodyTransform, type MonolithTransform, RAIL_OUTER, seamTransform } from './monolith-transforms';

export interface FrameConfig {
    height: number;
    opening: number;
    legWidth: number;
    lintel: number;
    depth: number;
    below: number;
    overhang: number;
    chamfer: number;
}

export interface FramePlacement {
    z: number;
    height: number;
}

export interface FrameParts {
    legs: MonolithTransform[];
    seams: MonolithTransform[];
    lintels: MonolithTransform[];
}

export const GATE_FRAME: FrameConfig = {
    height: 200,
    opening: 112,
    legWidth: 24,
    lintel: 32,
    depth: 24,
    below: 60,
    overhang: 6,
    chamfer: 0.45,
};

export const ARCH_FRAME: FrameConfig = {
    height: 150,
    opening: 112,
    legWidth: 32,
    lintel: 40,
    depth: 32,
    below: 60,
    overhang: 0,
    chamfer: 0.45,
};

export function lintelWidth( frame: FrameConfig ): number {
    return frame.opening + 2 * frame.legWidth + 2 * frame.overhang;
}

export function legShape( frame: FrameConfig, height = frame.height ): MonolithShapeConfig {
    return {
        taper: 1,
        chamfer: frame.chamfer,
        width: frame.legWidth,
        depth: frame.depth,
        height: height - frame.lintel,
        below: frame.below,
        gap: frame.opening / 2 - RAIL_OUTER,
        seam: EDGE_SEAM,
    };
}

export function lintelShape( frame: FrameConfig ): MonolithShapeConfig {
    return {
        taper: 1,
        chamfer: frame.chamfer,
        width: lintelWidth( frame ),
        depth: frame.depth,
        height: frame.lintel,
        below: 0,
        gap: 0,
        seam: EDGE_SEAM,
    };
}

export function lintelTransform( frame: FrameConfig, placement: FramePlacement ): MonolithTransform {
    return {
        position: [ 0, placement.height - frame.lintel / 2, placement.z ],
        scale: [ lintelWidth( frame ), frame.lintel, frame.depth ],
        rotationY: 0,
        rotationZ: 0,
    };
}

export function frameParts( frame: FrameConfig, placements: readonly FramePlacement[] ): FrameParts {
    const parts: FrameParts = { legs: [], seams: [], lintels: [] };
    for ( const placement of placements ) {
        const leg = legShape( frame, placement.height );
        for ( const side of [ -1, 1 ] ) {
            parts.legs.push( bodyTransform( leg, { z: placement.z, side } ) );
            parts.seams.push( seamTransform( leg, { z: placement.z, side } ) );
        }
        parts.lintels.push( lintelTransform( frame, placement ) );
    }
    return parts;
}
