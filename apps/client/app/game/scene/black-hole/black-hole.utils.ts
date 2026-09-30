import type { QualityTier } from '../../../quality/quality.constants';
import {
    BLACK_HOLE_PARAM,
    BLACK_HOLE_PLACEMENTS,
    DEG,
    DRAW_MAX,
    MIN_DISTANCE,
    TIER_PLAN,
    type TierPlan,
} from './black-hole.constants';

export type BlackHolePlacement = ( typeof BLACK_HOLE_PLACEMENTS )[ number ];

export interface LandmarkConfig {
    behind: number;
    height: number;
    radius: number;
    minAngle: number;
    parallax: number;
}

export interface Landmark {
    visible: boolean;
    x: number;
    y: number;
    z: number;
    half: number;
    drawDistance: number;
    yaw: number;
}

export function parseBlackHole( params: URLSearchParams ): BlackHolePlacement | null {
    const value = params.get( BLACK_HOLE_PARAM );
    return BLACK_HOLE_PLACEMENTS.find( ( p ) => p === value ) ?? null;
}

export function tierPlan( tier: QualityTier, reducedMotion: boolean ): TierPlan {
    const plan = TIER_PLAN[ tier ];
    return reducedMotion ? { ...plan, frozen: true } : plan;
}

export function placeLandmark(
    camX: number,
    camY: number,
    camZ: number,
    finishZ: number,
    cfg: LandmarkConfig,
    out: Landmark,
): Landmark {
    const distance = finishZ + cfg.behind - camZ;
    out.visible = distance > MIN_DISTANCE;
    if ( ! out.visible ) return out;
    const drawDistance = Math.min( distance, DRAW_MAX );
    const k = drawDistance / distance;
    const angle = Math.max( cfg.radius / distance, Math.tan( cfg.minAngle * DEG ) );
    out.drawDistance = drawDistance;
    out.half = angle * drawDistance;
    out.x = camX - camX * k;
    out.y = camY + ( cfg.height - camY ) * k;
    out.z = camZ + drawDistance;
    out.yaw = cfg.parallax * Math.atan2( camX, distance );
    return out;
}
