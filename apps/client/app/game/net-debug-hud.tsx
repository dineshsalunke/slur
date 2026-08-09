import type { Track as TrackHandle } from '@slur/shared';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { useRoom } from '../net/room-context';
import { LocalPlayer, Net, Sim } from './ecs/traits';

type Room = ReturnType< typeof useRoom >;
const KIND: Record< string, string > = { plain: '·', block: 'BLOCK', gap: 'GAP', finish: 'FIN' };

// One line per player: ★ marks you; shows x/z and a (gone) flag while dropped.
function playerLines( room: Room ): string[] {
    const lines: string[] = [];
    room.state.players.forEach( ( p, sid ) => {
        const me = sid === room.sessionId ? '★' : ' ';
        lines.push(
            `${ me } ${ sid.slice( 0, 4 ) }  x=${ p.x.toFixed( 1 ) } z=${ p.z.toFixed( 1 ) }${ p.connected ? '' : ' (gone)' }`,
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
    const ahead = [ 1, 2, 3, 4, 5, 6 ].map( ( n ) => KIND[ track.segmentAtZ( s.z + n * 20 ).kind ] ?? '?' ).join( ' ' );
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
    // JUSTIFIED EFFECT — syncs with external systems (Colyseus room.state + the ECS world) on a 150ms
    // timer, writing IMPERATIVELY into a DOM ref (textContent). NO setState → it never re-renders React.
    //  1) render-derivation? no — room.state / ECS Sim mutate OUTSIDE React and fire no re-render.
    //  2) event handler? no discrete event — it's a periodic sample of live external state.
    //  3) loader/action data? no — live per-frame telemetry, not navigation-time data.
    //  4) ref/module singleton? YES for the WRITE — we push straight into a DOM ref, React uninvolved;
    //     the effect's only job is to bracket the timer's start/stop to the HUD's mount.
    //  5) external sync? YES — a timer polling external stores. VERDICT: keep; imperative ref write, zero re-render.
    useEffect( () => {
        const id = setInterval( () => {
            const el = ref.current;
            if ( ! el ) return;
            const players = playerLines( room );
            el.textContent = [
                `room: ${ room.roomId }  (you: ${ room.sessionId.slice( 0, 4 ) })`,
                `players: ${ players.length }`,
                ...players,
                ...localShipLines( world, track ),
            ].join( '\n' );
        }, 150 );
        return () => clearInterval( id );
    }, [ room, world, track ] );
    return (
        <div
            ref={ ref }
            style={ {
                position: 'fixed',
                top: 8,
                left: 8,
                zIndex: 10,
                pointerEvents: 'none',
                font: '12px monospace',
                color: '#00ff88',
                background: 'rgba(0,0,0,0.6)',
                padding: '6px 8px',
                whiteSpace: 'pre',
                borderRadius: 4,
            } }
        />
    );
}
