// ADR-001 — the seam that decouples the room / client / sim / loaders from `seed`. Everything OUTSIDE this
// module (and its procgen backend track.ts) speaks a `TrackDescriptor` + `Track`; only the procgen provider
// knows a seed exists. `resolveTrack` is the single entry point that turns a descriptor into a Track, so
// ADR-002 can add the `authored` branch (a hand-built level loader) without any consumer changing.
//
// `length` + `tier` are RESERVED + UNWIRED for now (ADR-003 wires the procgen rule-system): resolveTrack
// ignores `tier`, and `length` falls back to TRACK_SEGMENTS inside makeProcgenTrack so the geometry is
// byte-identical to the pre-ADR seed-only path.

import { makeProcgenTrack, type ProcgenDescriptor, TRACK_SEGMENTS, type Track } from './track.js';

// The track spec that flows through room state, the /game loader, and the scene — a discriminated union.
// Only `procgen` is built today; `authored` is reserved (resolveTrack throws until ADR-002 lands the loader).
export type TrackDescriptor = ProcgenDescriptor | { kind: 'authored'; levelId: string };

// Single provider entry point: descriptor → Track. The ONE place that dispatches on `kind`.
export function resolveTrack( d: TrackDescriptor ): Track {
    switch ( d.kind ) {
        case 'procgen':
            return makeProcgenTrack( d );
        case 'authored':
            throw new Error( 'authored provider not built (ADR-002+)' );
    }
}

// Build the default procgen descriptor for a room seed: tier 0, full-length track. The one spot that mints a
// `procgen` descriptor from a raw seed — the server calls it in onCreate, so `seed` never leaks past here.
export function procgenDescriptor( seed: number ): TrackDescriptor {
    return { kind: 'procgen', seed, tier: 0, length: TRACK_SEGMENTS };
}
