import { addEffect } from '@react-three/fiber';
import { SEG_LEN, type Track as TrackHandle } from '@slur/shared';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { useRoom } from '../net/room-context';
import { LocalPlayer, Net, Sim } from './ecs/traits';

type Room = ReturnType< typeof useRoom >;
const KIND: Record< string, string > = { plain: '·', block: 'BLOCK', gap: 'GAP', finish: 'FIN' };
const SAMPLE_MS = 150;

function playerLines( room: Room ): string[] {
    const lines: string[] = [];
    room.state.players.forEach( ( p, sid ) => {
        const me = sid === room.sessionId ? '★' : ' ';
        lines.push(
            `${ me } ${ sid.slice( 0, 4 ) }  x=${ p.x.toFixed( 1 ) } z=${ p.z.toFixed( 1 ) } st=${ p.stunTimer.toFixed( 1 ) } pw=${ Array.from( p.slots ).join( '' ) }${ p.connected ? '' : ' (gone)' }`,
        );
    } );
    return lines;
}

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

export function NetDebugHud( { track }: { track: TrackHandle } ) {
    const room = useRoom();
    const world = useWorld();
    const ref = useRef< HTMLDivElement >( null );
    // JUSTIFIED EFFECT — its only job is to BRACKET the frame subscription to this HUD's mount, which is what
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
    return (
        <div
            ref={ ref }
            className="pointer-events-none fixed bottom-14 left-4 z-10 whitespace-pre rounded-[4px] bg-black/60 px-2 py-1.5 font-mono text-[12px] text-debug"
        />
    );
}
