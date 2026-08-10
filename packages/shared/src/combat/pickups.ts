// S5 pickups — grab logic. Post-ADR-002 the LAYOUT is no longer computed here: pickups are first-class
// `track.anchors` of `kind: 'pickup'`, MATERIALIZED by the provider (sim/track.ts) directly from the
// descriptor — same determinism guarantee (both ends compute identical positions; only per-slot availability
// in RunState.pickupTaken ever syncs). This module now owns only the grab test + the thin anchor→pickup read.

import type { Anchor, Track } from '../sim/track.js';
import { resolveTrack, type TrackDescriptor } from '../sim/track-provider.js';

// A track-placed pickup slot. `id` is the stable slot key (its segment index) → keys the pickupTaken map.
// Structurally a subset of `Anchor` (id/x/y/z), so `track.anchors.filter(kind==='pickup')` yields these.
export interface Pickup {
    id: string;
    x: number;
    y: number;
    z: number;
}

export const PICKUP_GRAB_RADIUS = 3; // units: fly within this in BOTH x and z to grab (grab-on-overlap).

// The pickup anchors on a track — the SINGLE source of truth is `track.anchors` (provider-materialized).
// A thin filter, not a computation: kept for call-site ergonomics + the descriptor→layout test wrappers.
export function pickupsOf( track: Track ): Anchor[] {
    return track.anchors.filter( ( a ) => a.kind === 'pickup' );
}

// Descriptor convenience wrapper: resolve the track, then read its pickup anchors. Same result the server /
// client get by filtering `track.anchors` directly — this just spares callers that only hold a descriptor an
// explicit resolveTrack. (Authored descriptors throw inside resolveTrack until that provider arm is built.)
export function pickupLayout( descriptor: TrackDescriptor ): Pickup[] {
    return pickupsOf( resolveTrack( descriptor ) );
}

// Grab-on-overlap: the ship is within PICKUP_GRAB_RADIUS in BOTH x and z (y ignored — pickups hover at
// ground level, and the ship flies low). PURE — the server decides granting + respawn timing.
export function grabPickup( ship: { x: number; z: number }, pickup: Pickup ): boolean {
    return Math.abs( ship.x - pickup.x ) < PICKUP_GRAB_RADIUS && Math.abs( ship.z - pickup.z ) < PICKUP_GRAB_RADIUS;
}
