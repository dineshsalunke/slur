import { addEffect } from '@react-three/fiber';
import type { Track as TrackHandle } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { useRoom } from '../../net/room-context/use-room';
import { SAMPLE_MS } from './net-debug-hud.constants';
import { localShipLines, playerLines } from './net-debug-hud.utils';

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
