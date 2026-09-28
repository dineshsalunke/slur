import type { FlightTuning } from '../constants.js';
import type { Contact } from './step.js';
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

export function bounceContact( s: SimShip, contact: Contact, t: FlightTuning ): BounceContact | null {
    if ( s.dead || contact === null ) return null;
    if ( contact.kind === 'hit' ) return { x: s.x, y: s.y, z: s.z - contact.dir * t.halfL };
    return { x: s.x - contact.dir * t.halfW, y: s.y, z: s.z };
}
