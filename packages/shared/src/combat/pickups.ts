import type { Anchor, Track } from '../sim/track.js';
import { resolveTrack, type TrackDescriptor } from '../sim/track-provider.js';

export interface Pickup {
    id: string;
    x: number;
    y: number;
    z: number;
}

export const PICKUP_GRAB_RADIUS = 3;

export function pickupsOf( track: Track ): Anchor[] {
    return track.anchors.filter( ( a ) => a.kind === 'pickup' );
}

export function pickupLayout( descriptor: TrackDescriptor ): Pickup[] {
    return pickupsOf( resolveTrack( descriptor ) );
}

export function grabPickup( ship: { x: number; z: number }, pickup: Pickup ): boolean {
    return Math.abs( ship.x - pickup.x ) < PICKUP_GRAB_RADIUS && Math.abs( ship.z - pickup.z ) < PICKUP_GRAB_RADIUS;
}
