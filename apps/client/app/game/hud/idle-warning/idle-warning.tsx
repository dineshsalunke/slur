import { PHASE, stalledFor } from '@slur/shared';
import { useEffect, useRef } from 'react';
import type { RunRoomLike } from '../../../net/run-room-like';
import { addHudWriter } from '../hud-writers/hud-writers.state';
import { idleText } from './idle-warning.utils';

export function IdleWarning( { room }: { room: RunRoomLike } ) {
    const textRef = useRef< HTMLParagraphElement >( null );

    // Syncs with the frame scheduler: the cleanup phase writes the idle countdown.
    useEffect( () => {
        return addHudWriter( 'hud.idle-warning', () => {
            const el = textRef.current;
            if ( ! el ) return;
            const s = room.state;
            const self = s.players.get( room.sessionId );
            const racing = s.phase === PHASE.racing && s.raceCap > 0 && self && ! self.finished && ! self.spectating;
            const text = racing ? idleText( stalledFor( s.elapsed, self.progressAt ) ) : '';
            if ( el.textContent !== text ) el.textContent = text;
        } );
    }, [ room ] );

    return (
        <p
            ref={ textRef }
            className="absolute inset-x-0 top-[30%] m-0 text-center text-[clamp(16px,3vh,30px)] font-bold tracking-[0.2em] text-marigold text-shadow-readout-marigold tabular-nums"
        />
    );
}
