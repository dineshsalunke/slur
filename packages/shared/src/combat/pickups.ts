// S5 pickups — track-placed power-ups whose LAYOUT is a pure function of the room seed (exactly like the
// track: deterministic hashing, NEVER Math.random). Both ends compute identical positions, so geometry never
// syncs; only per-slot availability (RunState.pickupTaken) does. Pure.
//
// S6: pickups sit ON the racing line (`corridorCenterX`) of EVERY non-gap segment, not only rare 'plain' ones.
// Procgen v2 made plain (wall-free) segments scarce (~10%), which starved the drop rate (~6–7/track). Placing
// each pickup in the moving corridor keeps density high AND rewards threading the line — the corridor is never
// walled, so the drop is always inside the ≥ MIN_LANE open band (grabbable, never buried in a cube).

import { corridorCenterX, isHole, SEG_LEN, START_SAFE, TRACK_SEGMENTS } from '../sim/track.js';
import { resolveTrack, type TrackDescriptor } from '../sim/track-provider.js';

// A track-placed pickup slot. `id` is the stable slot key (its segment index) → keys the pickupTaken map.
export interface Pickup {
    id: string;
    x: number;
    y: number;
    z: number;
}

export const PICKUP_SPACING = 3; // segments between pickup slots → a pickup roughly every PICKUP_SPACING·SEG_LEN (≈60u): dense drops.
export const PICKUP_GRAB_RADIUS = 3; // units: fly within this in BOTH x and z to grab (grab-on-overlap).

// Deterministic pickup layout: one candidate slot per PICKUP_SPACING segments after the start-safe zone,
// emitted for EVERY segment that has floor (skip only gaps/holes — nothing to grab over). Each pickup sits at
// the corridor centre (the racing line) at the segment's mid-row, so it is always inside the open band — no
// bolt floating inside a lethal cube. Both ends derive the same track (resolveTrack is O(1) + deterministic).
// Takes a TrackDescriptor (ADR-001): this is the exact seam ADR-002 re-cuts for authored levels. The procgen
// branch reads d.seed for corridorCenterX (a small procgen-internal read the authored branch will replace).
export function pickupLayout( descriptor: TrackDescriptor ): Pickup[] {
    if ( descriptor.kind !== 'procgen' ) throw new Error( 'authored pickup layout not built (ADR-002+)' );
    const seed = descriptor.seed;
    const track = resolveTrack( descriptor );
    const out: Pickup[] = [];
    for ( let seg = START_SAFE; seg < TRACK_SEGMENTS; seg += PICKUP_SPACING ) {
        if ( isHole( track.segmentAt( seg ) ) ) continue; // gap → no floor to stand on / grab over
        const z = seg * SEG_LEN + SEG_LEN / 2; // centred forward in the segment (the mid row corridorCenterX samples)
        out.push( { id: String( seg ), x: corridorCenterX( seed, seg ), y: 0, z } );
    }
    return out;
}

// Grab-on-overlap: the ship is within PICKUP_GRAB_RADIUS in BOTH x and z (y ignored — pickups hover at
// ground level, and the ship flies low). PURE — the server decides granting + respawn timing.
export function grabPickup( ship: { x: number; z: number }, pickup: Pickup ): boolean {
    return Math.abs( ship.x - pickup.x ) < PICKUP_GRAB_RADIUS && Math.abs( ship.z - pickup.z ) < PICKUP_GRAB_RADIUS;
}
