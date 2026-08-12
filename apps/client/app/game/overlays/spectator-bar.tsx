import { useEffect, useRef } from 'react';
import { HudPanel } from '../../ui/hud-panel';
import type { RunView } from '../net/use-run-view';
import { cycleSpectatorTarget, spectatorCam } from '../spectator';

// Shown only while the local player spectates (mid-race joiner). Displays the current target + ◀▶ buttons and
// binds Tab / ← / → to cycle. Targets = racers only (non-spectators). The R3F loop reads spectatorCam each
// frame to move the camera; this bar only WRITES the target via the module singleton (gate #3).
export function SpectatorBar( { view }: { view: RunView } ) {
    const racers = view.players.filter( ( p ) => ! p.spectating );
    const racerIds = racers.map( ( p ) => p.id );
    const target = racers.find( ( p ) => p.id === spectatorCam.targetSessionId ) ?? racers[ 0 ];

    // Latest racerIds in a ref so the keydown listener (registered ONCE) always cycles the current field,
    // without re-attaching the window listener on every 20Hz snapshot re-render.
    const racerIdsRef = useRef( racerIds );
    racerIdsRef.current = racerIds;

    // JUSTIFIED EFFECT — syncs with an external system: the DOM keyboard (Tab / ← / →) → the spectator-target
    // module singleton the R3F loop reads. Mounted ONLY while this bar is (i.e. while spectating).
    //  1) render-derivation? no — a discrete keypress isn't derivable from render state.
    //  2) event handler? this IS the handler; the effect only brackets its window-listener lifetime.
    //  3) loader/action data? no — a live per-keystroke intent, not navigation data.
    //  4) ref/module singleton? the target lives on spectator.ts (loop reads it every frame, outside React)
    //     and the current racer set is read via racerIdsRef; only the window listener needs a mount-scoped
    //     lifetime a ref can't give. 5) external sync? YES — DOM keydown → cycleSpectatorTarget.
    //  VERDICT: keep; empty deps register it once, cleanup removes it when spectating ends.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.code === 'Tab' || e.code === 'ArrowRight' ) {
                e.preventDefault();
                cycleSpectatorTarget( racerIdsRef.current, 1 );
            } else if ( e.code === 'ArrowLeft' ) {
                e.preventDefault();
                cycleSpectatorTarget( racerIdsRef.current, -1 );
            }
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
                onClick={ () => cycleSpectatorTarget( racerIds, -1 ) }
            >
                ◀
            </button>
            <span className="min-w-[90px] text-center font-semibold text-magenta">{ target?.name || '—' }</span>
            <button
                type="button"
                className="cursor-pointer rounded-[4px] border border-magenta bg-magenta/12 px-2.5 py-0.5 text-[16px] text-hud"
                onClick={ () => cycleSpectatorTarget( racerIds, 1 ) }
            >
                ▶
            </button>
        </HudPanel>
    );
}
