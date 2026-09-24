import { type ProcgenDescriptor, TRACK_SEGMENTS, type Track, type TrackGen } from './space.js';
import { makeProcgenTrack } from './track.js';

export type TrackDescriptor = ProcgenDescriptor | { kind: 'authored'; levelId: string };

export function resolveTrack( d: TrackDescriptor ): Track {
    switch ( d.kind ) {
        case 'procgen':
            return makeProcgenTrack( d );
        case 'authored':
            throw new Error( 'authored provider not built (ADR-002+)' );
    }
}

export function procgenDescriptor( seed: number, gen: TrackGen = 'weave' ): TrackDescriptor {
    return { kind: 'procgen', seed, tier: 0, length: TRACK_SEGMENTS, gen };
}
