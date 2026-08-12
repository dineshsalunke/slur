import { addEffect } from '@react-three/fiber';
import { SEG_LEN, type Track as TrackHandle } from '@slur/shared';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { useRoom } from '../net/room-context';
import { LocalPlayer, Net, Sim } from './ecs/traits';

type Room = ReturnType< typeof useRoom >;
const KIND: Record< string, string > = { plain: '·', block: 'BLOCK', gap: 'GAP', finish: 'FIN' };
// How often the readout re-samples (ms). This is a THROTTLE on the frame loop, not a clock of its own — see
// the effect below for why this call site keeps a cadence where the threat vignette (#96) deliberately doesn't.
const SAMPLE_MS = 150;

// One line per player: ★ marks you; shows x/z and a (gone) flag while dropped.
function playerLines( room: Room ): string[] {
    const lines: string[] = [];
    room.state.players.forEach( ( p, sid ) => {
        const me = sid === room.sessionId ? '★' : ' ';
        lines.push(
            `${ me } ${ sid.slice( 0, 4 ) }  x=${ p.x.toFixed( 1 ) } z=${ p.z.toFixed( 1 ) } st=${ p.stunTimer.toFixed( 1 ) } pw=${ p.heldPower }${ p.connected ? '' : ' (gone)' }`,
        );
    } );
    return lines;
}

// The local PREDICTED ship + its class + what it's flying over — the diagnostic for "falls at ~120".
function localShipLines( world: World, track: TrackHandle ): string[] {
    const e = world.queryFirst( LocalPlayer, Sim );
    const s = e?.get( Sim );
    if ( ! s ) return [];
    const seg = track.segmentAtZ( s.z );
    const ahead = [ 1, 2, 3, 4, 5, 6 ]
        .map( ( n ) => KIND[ track.segmentAtZ( s.z + n * SEG_LEN ).kind ] ?? '?' )
        .join( ' ' );
    return [
        `ship: ${ e?.get( Net )?.shipId ?? '?' }  (keys 1-5 to swap)`,
        `me y=${ s.y.toFixed( 2 ) } z=${ s.z.toFixed( 0 ) } grnd=${ s.grounded ? 1 : 0 } dead=${ s.dead ? 1 : 0 }`,
        `over: seg${ seg.index } ${ seg.kind } floors=${ seg.floors.length }`,
        `ahead: ${ ahead }`,
    ];
}

// Dev-only readout: polls room.state (150ms, not per-frame) so you can CONFIRM connectivity with a
// number. `players: 2` in both windows = same room, the fix works. `players: 1` in each = the two tabs
// landed in separate rooms (a different bug). ★ marks your own ship.
export function NetDebugHud( { track }: { track: TrackHandle } ) {
    const room = useRoom();
    const world = useWorld();
    const ref = useRef< HTMLDivElement >( null );
    // JUSTIFIED EFFECT — its only job is to BRACKET the frame subscription to this HUD's mount, which is what
    // Effects are for (subscribe/unsubscribe to an external system). The sampling itself is imperative, straight
    // into a DOM ref (textContent). NO setState → it never re-renders React.
    //
    // MECHANISM — R3F `addEffect` (issue #87), a global per-frame callback that runs on R3F's EXISTING loop but
    // OUTSIDE the Canvas. This HUD is DOM chrome, so it needs a frame signal without being scene content. The
    // previous `setInterval` was a second clock that drifted against the 20Hz patch stream.
    //
    // THE 150ms CADENCE IS KEPT, unlike the threat vignette in #96 — the two call sites genuinely differ, and
    // the cadence should follow what the callback DRIVES:
    //   · the vignette drives a CONTINUOUS opacity, so any throttle reintroduces visible stepping — there, the
    //     throttle was the defect, and running per-frame let its smoothing transition be deleted outright.
    //   · this drives a TEXT readout a human reads. 60Hz buys nothing the eye can use, and sampling is not free:
    //     each pass walks every player, reads `room.state.projectiles.size`, queries the ECS world, and calls
    //     `track.segmentAtZ` SEVEN times. At 150ms that is ~47 segment lookups/sec; per-frame it would be ~420.
    // So: throttle by comparing `addEffect`'s timestamp (ms since page load, NOT a delta), which keeps one clock
    // for the whole app while sampling at a rate that suits the consumer.
    useEffect( () => {
        let lastSample = 0;
        return addEffect( ( timestamp ) => {
            if ( timestamp - lastSample < SAMPLE_MS ) return;
            lastSample = timestamp;
            const el = ref.current;
            if ( ! el ) return;
            const players = playerLines( room );
            el.textContent = [
                `room: ${ room.roomId }  (you: ${ room.sessionId.slice( 0, 4 ) })`,
                `players: ${ players.length }  bolts: ${ room.state.projectiles.size }`,
                ...players,
                ...localShipLines( world, track ),
            ].join( '\n' );
        } );
    }, [ room, world, track ] );
    // bottom-LEFT, but stacked ABOVE the audio toggle (#63, `bottom-4 left-4`, ~30px tall) so the dev readout
    // clears it — bottom-14 sits its base ~10px over the button's top. z-10 keeps it under every real overlay
    // (panels z-20); pointer-events-none so it never intercepts a click (the button underneath still toggles).
    return (
        <div
            ref={ ref }
            className="pointer-events-none fixed bottom-14 left-4 z-10 whitespace-pre rounded-[4px] bg-black/60 px-2 py-1.5 font-mono text-[12px] text-debug"
        />
    );
}
