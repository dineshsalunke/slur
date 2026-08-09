// S5 pickups — track-placed power-ups whose LAYOUT is a pure function of the room seed (exactly like the
// track: hash2 + mulberry32, integer/float PRNG ops — NEVER Math.random). Both ends compute identical
// positions, so geometry never syncs; only per-slot availability (RunState.pickupTaken) does. Pure.

import { hash2, mulberry32 } from '../sim/rng.js';
import { HALF_WIDTH, makeTrack, SEG_LEN, START_SAFE, TRACK_SEGMENTS } from '../sim/track.js';

// A track-placed pickup slot. `id` is the stable slot key (its segment index) → keys the pickupTaken map.
export interface Pickup {
    id: string;
    x: number;
    y: number;
    z: number;
}

export const PICKUP_SPACING = 8; // segments between pickup slots → one pickup roughly every PICKUP_SPACING·SEG_LEN u.
export const PICKUP_GRAB_RADIUS = 3; // units: fly within this in BOTH x and z to grab (grab-on-overlap).

// Deterministic pickup layout: sample one candidate slot per PICKUP_SPACING segments after the start-safe
// zone, but ONLY emit it if that segment is PLAIN (skip block/gap/finish) so every pickup is actually
// grabbable — no bolt floating inside a lethal cube or over a gap. The track is derived from the SAME seed
// (makeTrack is O(1) random-access + deterministic), so both ends compute an identical layout. Each slot is
// jittered laterally within the corridor (a grab-radius clear of the rails), centred forward in its segment.
export function pickupLayout( seed: number ): Pickup[] {
    const track = makeTrack( seed );
    const out: Pickup[] = [];
    for ( let seg = START_SAFE; seg < TRACK_SEGMENTS; seg += PICKUP_SPACING ) {
        if ( track.segmentAt( seg ).kind !== 'plain' ) continue; // hazard-aware: only plain segments are grabbable
        const rnd = mulberry32( hash2( seed, seg ) );
        const x = ( rnd() * 2 - 1 ) * ( HALF_WIDTH - PICKUP_GRAB_RADIUS ); // across the lanes, clear of the side walls
        const z = seg * SEG_LEN + SEG_LEN / 2; // centred forward in the segment
        out.push( { id: String( seg ), x, y: 0, z } );
    }
    return out;
}

// Grab-on-overlap: the ship is within PICKUP_GRAB_RADIUS in BOTH x and z (y ignored — pickups hover at
// ground level, and the ship flies low). PURE — the server decides granting + respawn timing.
export function grabPickup( ship: { x: number; z: number }, pickup: Pickup ): boolean {
    return Math.abs( ship.x - pickup.x ) < PICKUP_GRAB_RADIUS && Math.abs( ship.z - pickup.z ) < PICKUP_GRAB_RADIUS;
}
