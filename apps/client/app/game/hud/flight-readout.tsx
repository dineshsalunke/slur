import { addEffect } from '@react-three/fiber';
import type { Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { LocalPlayer, Sim } from '../ecs/traits';
import { clockText, progressText, rankText, speedText } from './readout-format';

export function FlightReadout( {
    track,
    rank,
    field,
    clock,
}: {
    track: Track;
    rank: number;
    field: number;
    clock: () => number;
} ) {
    const world = useWorld();
    const speedRef = useRef< HTMLSpanElement >( null );
    const progressRef = useRef< HTMLSpanElement >( null );
    const clockRef = useRef< HTMLSpanElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect( () => {
        return addEffect( () => {
            const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
            if ( ! sim ) return;
            if ( speedRef.current ) speedRef.current.textContent = speedText( sim.vz );
            if ( progressRef.current ) progressRef.current.textContent = progressText( sim.z, track.finishZ );
            if ( clockRef.current ) clockRef.current.textContent = clockText( clock() );
        } );
    }, [ world, track, clock ] );

    return (
        <div className="absolute bottom-0 left-0 flex flex-col gap-[0.55em]">
            <div className="flex items-baseline gap-[0.22em] leading-none">
                <span
                    ref={ speedRef }
                    className="text-[clamp(34px,6.1vh,62px)] font-bold tracking-[0.01em] tabular-nums"
                />
                <span className="text-[clamp(11px,2vh,20px)] font-normal normal-case tracking-[0.06em] text-readout-dim">
                    u/s
                </span>
            </div>
            <div className="flex items-baseline gap-[1.6em] text-[clamp(11px,1.95vh,19px)] leading-none font-semibold tracking-[0.14em] tabular-nums">
                <span>{ rankText( rank, field ) }</span>
                <span ref={ progressRef } />
                <span ref={ clockRef } />
            </div>
        </div>
    );
}
