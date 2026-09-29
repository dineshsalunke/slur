import { PHASE } from '@slur/shared';
import { useEffect, useRef } from 'react';
import type { RunRoomLike } from '../../../net/run-room-like';
import { addHudWriter } from '../hud-writers/hud-writers.state';
import { deadlineText } from './race-deadline.utils';

export function RaceDeadline( { room }: { room: RunRoomLike } ) {
    const textRef = useRef< HTMLParagraphElement >( null );

    // Syncs with the frame scheduler: the cleanup phase writes the race-end countdown.
    useEffect( () => {
        return addHudWriter( 'hud.race-deadline', () => {
            const el = textRef.current;
            if ( ! el ) return;
            const s = room.state;
            const text = s.phase === PHASE.racing ? deadlineText( s.elapsed, s.finishDeadline, s.raceCap ) : '';
            if ( el.textContent !== text ) el.textContent = text;
        } );
    }, [ room ] );

    return (
        <p
            ref={ textRef }
            className="absolute top-12 right-0 m-0 text-right text-[clamp(11px,1.95vh,19px)] leading-none font-semibold tracking-[0.14em] tabular-nums"
        />
    );
}
