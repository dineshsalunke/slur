import { addEffect } from '@react-three/fiber';
import { Fragment, useEffect, useRef } from 'react';
import type { RunRoomLike } from '../../../net/run-room-like';
import { COMMIT_VIGNETTE } from './seeker-warning.constants';
import { lockShift, lockText, lockVisible, makeLock, nearestLock } from './seeker-warning.utils';

export function SeekerWarning( { room }: { room: RunRoomLike } ) {
    const chevronRef = useRef< HTMLDivElement >( null );
    const vignetteRef = useRef< HTMLDivElement >( null );
    const lockRef = useRef( makeLock() );

    // Brackets an R3F render-loop subscription to this mount: each frame writes the seeker lock chevron.
    useEffect( () => {
        return addEffect( ( timestamp ) => {
            const chevronEl = chevronRef.current;
            const vignetteEl = vignetteRef.current;
            if ( ! chevronEl || ! vignetteEl ) return;
            const lock = lockRef.current;
            nearestLock( room.state.seekers.values(), room.sessionId, room.state.players.get( room.sessionId ), lock );
            const text = lockText( lock );
            if ( chevronEl.textContent !== text ) chevronEl.textContent = text;
            chevronEl.dataset.ahead = String( lock.ahead );
            chevronEl.style.setProperty( '--on', lockVisible( lock, timestamp ) ? '1' : '0' );
            chevronEl.style.setProperty( '--shift', String( lockShift( lock.dx ) ) );
            vignetteEl.style.setProperty( '--lock', lock.committed ? String( COMMIT_VIGNETTE ) : '0' );
        } );
    }, [ room ] );

    return (
        <Fragment>
            <div
                ref={ vignetteRef }
                className="threat-vignette pointer-events-none fixed inset-0 z-19 opacity-[var(--lock,0)]"
            />
            <div
                ref={ chevronRef }
                className="pointer-events-none fixed bottom-[14%] left-[calc(50%+var(--shift,0)*18vw)] z-21 -translate-x-1/2 whitespace-pre font-mono text-[clamp(16px,3vh,30px)] font-bold leading-none tracking-[0.2em] text-threat opacity-[var(--on,0)] text-shadow-threat data-[ahead=true]:top-[14%] data-[ahead=true]:bottom-auto"
            />
        </Fragment>
    );
}
