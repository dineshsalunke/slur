import { HALF_WIDTH } from '@slur/shared';
import type { MonolithShapeConfig, MonolithShapeName } from './monolith-config';
import type { MonolithPlacement } from './monolith-field';
import type { MonolithProfile } from './monolith-geometry';
import { RAIL_W } from './track-geometry';

export interface MonolithTransform {
    position: [ number, number, number ];
    scale: [ number, number, number ];
    rotationY: number;
    rotationZ: number;
}

const RAIL_OUTER = HALF_WIDTH + RAIL_W;

export function bodySpan( shape: MonolithShapeConfig ): number {
    return shape.height + shape.below;
}

export function taperAt( shape: MonolithShapeConfig, y: number ): number {
    const span = bodySpan( shape );
    const t = ( y + shape.below ) / span;
    return 1 + ( shape.taper - 1 ) * t;
}

export function innerFaceX( shape: MonolithShapeConfig ): number {
    return RAIL_OUTER + shape.gap;
}

export function shapeProfile( shape: MonolithShapeConfig ): MonolithProfile {
    return {
        taper: shape.taper,
        chamferX: shape.chamfer / shape.width,
        chamferZ: shape.chamfer / shape.depth,
    };
}

export function bodyTransform( shape: MonolithShapeConfig, placement: MonolithPlacement ): MonolithTransform {
    return {
        position: [
            placement.side * ( innerFaceX( shape ) + shape.width / 2 ),
            ( shape.height - shape.below ) / 2,
            placement.z,
        ],
        scale: [ shape.width, bodySpan( shape ), shape.depth ],
        rotationY: 0,
        rotationZ: 0,
    };
}

export function seamTransform( shape: MonolithShapeConfig, placement: MonolithPlacement ): MonolithTransform {
    const { seam } = shape;
    const faceSign = seam.face === 'inner' ? -1 : 1;
    const alignSign = seam.align === 'near' ? -1 : 1;
    const y = shape.height / 2;
    const scale = taperAt( shape, y );
    const lean = ( placement.side * faceSign * ( shape.width / 2 ) * ( shape.taper - 1 ) ) / bodySpan( shape );
    const onCorner = seam.align !== 'center';
    const bevel = ( onCorner ? shape.chamfer / 2 : 0 ) * scale;
    const faceX = ( shape.width * scale ) / 2 - bevel;
    const alongZ = onCorner ? alignSign * ( ( shape.depth * scale ) / 2 - bevel ) : 0;
    const outX = placement.side * faceSign;

    return {
        position: [
            placement.side * ( innerFaceX( shape ) + shape.width / 2 + faceSign * faceX ),
            y,
            placement.z + alongZ,
        ],
        scale: [ seam.proud, shape.height * Math.hypot( 1, lean ), seam.width ],
        rotationY: onCorner ? Math.atan2( -alignSign, outX ) : 0,
        rotationZ: -Math.atan( lean ),
    };
}

export function shapeAt( z: number, side: number, shapes: readonly MonolithShapeName[] ): MonolithShapeName {
    const h = Math.imul( Math.round( z ) ^ ( side > 0 ? 0x9e3779b9 : 0x85ebca6b ), 0x27d4eb2d ) >>> 0;
    return shapes[ ( h >>> 13 ) % shapes.length ];
}
