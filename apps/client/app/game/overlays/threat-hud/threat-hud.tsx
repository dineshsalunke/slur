import type { Room } from '@colyseus/sdk';
import { addEffect } from '@react-three/fiber';
import type { RunState } from '@slur/shared';
import { Fragment, useEffect, useRef } from 'react';
import { THREAT_X, THREAT_Z } from './threat-hud.constants';
import { threatTick, vignetteOpacity } from './threat-hud.utils';

export function ThreatHud( { room }: { room: Room< RunState > } ) {
    const tickRef = useRef< HTMLDivElement >( null );
    const vignetteRef = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — it does nothing but BRACKET the frame subscription to this component's mount, which is
    useEffect( () => {
        return addEffect( () => {
            const tickEl = tickRef.current;
            const vignetteEl = vignetteRef.current;
            if ( ! tickEl || ! vignetteEl ) return;
            const self = room.state.players.get( room.sessionId );
            let nearest: number | null = null;
            let bestDz = Number.POSITIVE_INFINITY;
            if ( self && ! self.spectating && ! self.dead ) {
                room.state.projectiles.forEach( ( b ) => {
                    if ( b.ownerId === room.sessionId ) return;
                    const dz = self.z - b.z;
                    const dx = b.x - self.x;
                    if ( dz > -2 && dz < THREAT_Z && Math.abs( dx ) < THREAT_X && dz < bestDz ) {
                        bestDz = dz;
                        nearest = dx;
                    }
                } );
            }
            const tick = threatTick( nearest );
            tickEl.textContent = tick ?? '';
            tickEl.style.setProperty( '--tick', tick ? '1' : '0' );
            vignetteEl.style.setProperty( '--threat', String( vignetteOpacity( bestDz ) ) );
        } );
    }, [ room ] );

    return (
        <Fragment>
            <div
                ref={ vignetteRef }
                className="threat-vignette pointer-events-none fixed inset-0 z-19 opacity-[var(--threat,0)]"
            />
            <div
                ref={ tickRef }
                className="pointer-events-none fixed top-16 left-1/2 z-21 -translate-x-1/2 whitespace-pre font-mono text-[16px] font-bold leading-none tracking-[3px] text-threat opacity-[var(--tick,0)] text-shadow-threat"
            />
        </Fragment>
    );
}
