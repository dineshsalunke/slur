export const PICKUP_COLLECT_S = 0.32;
export const PICKUP_REVEAL_S = 0.5;
const COLLECT_LIFT = 2.2;
const COLLECT_SPIN = 10;
const COLLECT_SWELL = 0.5;
const REVEAL_SINK = 0.8;
const BACK = 1.70158;

export interface PickupPose {
    scale: number;
    lift: number;
    spin: number;
}

function easeOutBack( u: number ): number {
    const v = u - 1;
    return 1 + ( BACK + 1 ) * v * v * v + BACK * v * v;
}

export function pickupPose( gone: boolean, since: number, out: PickupPose ): PickupPose {
    if ( gone ) {
        const u = Math.min( 1, since / PICKUP_COLLECT_S );
        out.scale = u >= 1 ? 0 : ( 1 + COLLECT_SWELL * u ) * ( 1 - u ) ** 1.5;
        out.lift = COLLECT_LIFT * u * ( 2 - u );
        out.spin = COLLECT_SPIN * u * u;
        return out;
    }
    const u = Math.min( 1, since / PICKUP_REVEAL_S );
    out.scale = easeOutBack( u );
    out.lift = -REVEAL_SINK * ( 1 - u ) ** 2;
    out.spin = 0;
    return out;
}
