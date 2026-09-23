import type { FlightTuning } from '../constants.js';
import type { SimShip } from './types.js';

export const BOUNCE_MESSAGE = 'bounce';

export interface BounceContact {
    x: number;
    y: number;
    z: number;
}

export interface BounceMessage extends BounceContact {
    victimId: string;
}

export function bounceContact(
    s: SimShip,
    stunBefore: number,
    vzBefore: number,
    dt: number,
    t: FlightTuning,
): BounceContact | null {
    if ( s.dead || s.stunTimer <= Math.max( 0, stunBefore - dt ) + 1e-6 ) return null;
    const zFace = vzBefore !== 0 && Math.sign( s.vz ) !== Math.sign( vzBefore );
    return {
        x: zFace ? s.x : s.x - Math.sign( s.vx ) * t.halfW,
        y: s.y,
        z: zFace ? s.z - Math.sign( s.vz ) * t.halfL : s.z,
    };
}
