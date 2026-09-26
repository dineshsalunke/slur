import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useEffect, useReducer, useRef } from 'react';
import { HudPanel } from '../../ui/hud-panel';
import { useRunPlayers } from '../net/run-view-store';
import { cycleSpectatorTarget, resolveSpectatorTarget } from '../spectator';

export function SpectatorBar( { room }: { room: Room< RunState > } ) {
    const [ , retarget ] = useReducer( ( n: number ) => n + 1, 0 );
    const racers = useRunPlayers( room ).filter( ( p ) => ! p.spectating );
    const racerIds = racers.map( ( p ) => p.id );
    const targetId = resolveSpectatorTarget( room.state.players );
    const target = racers.find( ( p ) => p.id === targetId );

    const racerIdsRef = useRef( racerIds );
    racerIdsRef.current = racerIds;

    const cycle = ( dir: 1 | -1 ) => {
        cycleSpectatorTarget( racerIdsRef.current, dir );
        retarget();
    };

    // JUSTIFIED EFFECT — syncs with an external system: the DOM keyboard (Tab / ← / →) → the spectator-target
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.code !== 'Tab' && e.code !== 'ArrowRight' && e.code !== 'ArrowLeft' ) return;
            e.preventDefault();
            cycleSpectatorTarget( racerIdsRef.current, e.code === 'ArrowLeft' ? -1 : 1 );
            retarget();
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [] );

    return (
        <HudPanel
            accent="magenta"
            className="fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 px-3.5 py-3"
        >
            <span className="text-[11px] uppercase tracking-[2px] opacity-[0.75]">
                Spectating — you race next round
            </span>
            <button
                type="button"
                className="cursor-pointer rounded-[4px] border border-magenta bg-magenta/12 px-2.5 py-0.5 text-[16px] text-hud"
                onClick={ () => cycle( -1 ) }
            >
                ◀
            </button>
            <span className="min-w-[90px] text-center font-semibold text-magenta">{ target?.name || '—' }</span>
            <button
                type="button"
                className="cursor-pointer rounded-[4px] border border-magenta bg-magenta/12 px-2.5 py-0.5 text-[16px] text-hud"
                onClick={ () => cycle( 1 ) }
            >
                ▶
            </button>
        </HudPanel>
    );
}
