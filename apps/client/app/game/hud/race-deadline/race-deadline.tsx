import { addEffect } from '@react-three/fiber';
import { PHASE } from '@slur/shared';
import { useEffect, useRef } from 'react';
import type { RunRoomLike } from '../../../net/run-room-like';
import { deadlineText } from './race-deadline.utils';

export function RaceDeadline( { room }: { room: RunRoomLike } ) {
    const textRef = useRef< HTMLParagraphElement >( null );

    // Brackets an R3F render-loop subscription to this mount: each frame writes the race-end countdown.
    useEffect( () => {
        return addEffect( () => {
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
