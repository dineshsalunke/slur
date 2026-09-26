import { pickupIdSalt, pickupOrdinal } from '../sim/pickup-place.js';
import type { Anchor, Track } from '../sim/space.js';
import { resolveTrack, type TrackDescriptor } from '../sim/track-provider.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import type { HeldPower } from './constants.js';
import { POWER_BAG_SIZE, powerBag } from './power-bag.js';

export interface Pickup {
    id: string;
    x: number;
    y: number;
    z: number;
}

export interface GrabHull {
    x: number;
    z: number;
    halfW: number;
    halfL: number;
}

export function pickupsOf( track: Track ): Anchor[] {
    return track.anchors.filter( ( a ) => a.kind === 'pickup' );
}

export function pickupLayout( descriptor: TrackDescriptor ): Pickup[] {
    return pickupsOf( resolveTrack( descriptor ) );
}

export function grabPickup( ship: GrabHull, pickup: Pickup, cfg: SimConfig = DEFAULT_SIM_CONFIG ): boolean {
    const r = cfg.pickupGrabR;
    return Math.abs( ship.x - pickup.x ) < r + ship.halfW && Math.abs( ship.z - pickup.z ) < r + ship.halfL;
}

export function pickupPower( id: string, cfg: SimConfig = DEFAULT_SIM_CONFIG ): HeldPower {
    const ordinal = pickupOrdinal( id );
    const bag = powerBag( pickupIdSalt( id ), Math.floor( ordinal / POWER_BAG_SIZE ), cfg );
    return bag[ ordinal % POWER_BAG_SIZE ];
}
