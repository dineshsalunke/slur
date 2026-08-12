import { PHASE } from '@slur/shared';
import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { HudButton } from '../../ui/hud-button';
import { HudPanel } from '../../ui/hud-panel';

// Guards an accidental exit MID-RACE: useBlocker stops in-app SPA nav (back button / <Link>) and a
// beforeunload handler covers hard tab-close/reload (useBlocker does NOT — react-router.md). Both are armed
// only while racing. Renders nothing unless nav is actively blocked, then a confirm. It NEVER calls
// room.leave() — teardown is the deliberate <LeaveButton> action (gate #6); proceed just resumes the nav.
export function LeaveGuard( { phase }: { phase: number } ) {
    const racing = phase === PHASE.racing;
    const blocker = useBlocker( racing );

    // JUSTIFIED EFFECT — syncs with an external system: the browser's beforeunload (hard tab close/reload),
    // which useBlocker cannot cover (it guards only in-app SPA nav). Armed ONLY while racing.
    //  1) render-derivation? no — a native browser lifecycle event, not derivable from state.
    //  2) event handler? this IS the handler; the effect only brackets its window-listener lifetime.
    //  3) loader/action data? no — a browser-close signal, not navigation data.
    //  4) ref/module singleton? no persistent resource — a bare window listener scoped to the racing phase.
    //  5) external sync? YES — window beforeunload. VERDICT: keep; cleanup removes it when racing ends.
    useEffect( () => {
        if ( ! racing ) return;
        const onBeforeUnload = ( e: BeforeUnloadEvent ) => {
            e.preventDefault();
            e.returnValue = ''; // legacy contract: a non-empty returnValue triggers the native prompt
        };
        addEventListener( 'beforeunload', onBeforeUnload );
        return () => removeEventListener( 'beforeunload', onBeforeUnload );
    }, [ racing ] );

    if ( blocker.state !== 'blocked' ) return null;
    return (
        <div className="pointer-events-auto fixed inset-0 z-40 grid place-items-center bg-void/55">
            <HudPanel className="px-3.5 py-3 text-center">
                <p className="my-4">Leave the race in progress?</p>
                <div className="flex justify-end gap-2.5">
                    <HudButton variant="go" onClick={ () => blocker.proceed() }>
                        Leave
                    </HudButton>
                    <HudButton variant="leave" onClick={ () => blocker.reset() }>
                        Stay
                    </HudButton>
                </div>
            </HudPanel>
        </div>
    );
}
