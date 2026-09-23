import { hash2 } from '../sim/rng.js';
import type { Anchor, Track } from '../sim/space.js';
import { resolveTrack, type TrackDescriptor } from '../sim/track-provider.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { HeldPower } from './constants.js';

export interface Pickup {
    id: string;
    x: number;
    y: number;
    z: number;
}

export const PICKUP_GRAB_RADIUS = 3;

const SALT_PICKUP_POWER = 0x5e3c4b21 | 0;
const HASH_SCALE = 4294967296;

export function pickupsOf( track: Track ): Anchor[] {
    return track.anchors.filter( ( a ) => a.kind === 'pickup' );
}

export function pickupLayout( descriptor: TrackDescriptor ): Pickup[] {
    return pickupsOf( resolveTrack( descriptor ) );
}

export function grabPickup( ship: { x: number; z: number }, pickup: Pickup ): boolean {
    return Math.abs( ship.x - pickup.x ) < PICKUP_GRAB_RADIUS && Math.abs( ship.z - pickup.z ) < PICKUP_GRAB_RADIUS;
}

function hashId( id: string ): number {
    let h = SALT_PICKUP_POWER;
    for ( let i = 0; i < id.length; i++ ) h = hash2( h, id.charCodeAt( i ) ) | 0;
    return h >>> 0;
}

export function pickupPower( id: string, cfg: SimConfig = DEFAULT_SIM_CONFIG ): HeldPower {
    return hashId( id ) / HASH_SCALE < cfg.seekerRatio ? HeldPower.seeker : HeldPower.bolt;
}
