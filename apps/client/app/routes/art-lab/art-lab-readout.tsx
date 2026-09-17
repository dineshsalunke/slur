import { addEffect } from '@react-three/fiber';
import {
    HALF_WIDTH,
    intensityAt,
    passableCorridorWidth,
    SEG_LEN,
    type SimShip,
    TRACK_SEGMENTS,
    type Track as TrackHandle,
} from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { LocalPlayer, Sim } from '../../game/ecs/traits';

const KIND: Record< string, string > = { plain: '·', block: 'BLK', gap: 'GAP', finish: 'FIN' };
// Throttle (ms). Same reasoning as `net-debug-hud.tsx`: this drives a TEXT readout a human reads, and each
// pass calls `track.segmentAtZ` eight times. 60Hz buys nothing the eye can use.
const SAMPLE_MS = 120;

// A→B→C band for an intensity scalar. The handoff's three intensity states are a presentation of the SAME
// `intensityAt` curve the generator already uses (ADD §4), so the lab labels them off that one number
// rather than inventing a second notion of intensity that could drift from the gameplay one.
function band( intensity: number ): string {
    if ( intensity < 0.34 ) return 'A subtle';
    if ( intensity < 0.67 ) return 'B balanced';
    return 'C intense';
}

function shipState( s: { dead: boolean; grounded: boolean } ): string {
    if ( s.dead ) return 'DEAD';
    return s.grounded ? 'grounded' : 'air';
}

// The six segments ahead, as a glanceable strip — the same "what am I flying into" read as the net debug HUD.
function aheadStrip( track: TrackHandle, z: number ): string {
    return [ 1, 2, 3, 4, 5, 6 ].map( ( n ) => KIND[ track.segmentAtZ( z + n * SEG_LEN ).kind ] ?? '?' ).join( ' ' );
}

// Build the whole readout as lines. Split out of the frame callback so the callback stays a thin
// throttle+write, and so this stays under the cognitive-complexity budget Biome enforces.
function readoutLines( track: TrackHandle, s: SimShip ): string[] {
    const seg = track.segmentAtZ( s.z );
    const intensity = intensityAt( seg.index, TRACK_SEGMENTS );
    const corridor = passableCorridorWidth( seg );
    const width = 2 * HALF_WIDTH;
    return [
        `z ${ s.z.toFixed( 0 ) } / ${ track.finishZ }   seg ${ seg.index }/${ TRACK_SEGMENTS }  ${ seg.kind }`,
        `speed ${ s.vz.toFixed( 1 ) } u/s   x ${ s.x.toFixed( 1 ) }   ${ shipState( s ) }`,
        `intensity ${ intensity.toFixed( 2 ) }  → ${ band( intensity ) }`,
        `corridor ${ corridor.toFixed( 1 ) }u of ${ width }u  (${ ( ( corridor / width ) * 100 ).toFixed( 0 ) }% of ribbon)`,
        `ahead ${ aheadStrip( track, s.z ) }`,
    ];
}

/**
 * Per-frame lab telemetry. The numbers that actually matter for an art review: where you are, how fast,
 * what the difficulty envelope is doing, and how wide the threadable corridor is right now — the last one
 * being the number the whole 64u-vs-48u question turns on (ADD §10 OQ6).
 */
export function ArtLabReadout( { track }: { track: TrackHandle } ) {
    const world = useWorld();
    const ref = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — external sync: brackets a per-frame subscription to this component's mount, which
    // is the canonical Effect job (subscribe/unsubscribe). Sampling writes straight to a DOM ref; there is
    // no setState, so this never re-renders React.
    //
    // MECHANISM — R3F `addEffect` (the mechanism established by issue #87 / PR #99 for exactly this): a
    // global per-frame callback that runs on R3F's EXISTING loop but OUTSIDE the Canvas, which is what DOM
    // chrome needs. Rejected: `setInterval` (a second clock that drifts against the frame loop — explicitly
    // rejected on sight by CONTRIBUTING §5), a raw rAF (a third loop), and putting this in the rig's
    // `useFrame` (would couple DOM text to scene content and force the HUD inside the Canvas tree).
    useEffect( () => {
        let lastSample = 0;
        return addEffect( ( timestamp ) => {
            if ( timestamp - lastSample < SAMPLE_MS ) return;
            lastSample = timestamp;
            const el = ref.current;
            if ( ! el ) return;
            const s = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
            if ( ! s ) return;
            el.textContent = readoutLines( track, s ).join( '\n' );
        } );
    }, [ world, track ] );

    return (
        <div
            ref={ ref }
            className="pointer-events-none fixed bottom-4 left-4 z-10 whitespace-pre rounded bg-black/70 px-3 py-2 font-mono text-[12px] leading-relaxed text-cyan-300"
        />
    );
}
