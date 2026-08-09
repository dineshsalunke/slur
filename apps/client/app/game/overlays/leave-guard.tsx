import { PHASE } from '@slur/shared';
import { useEffect } from 'react';
import { useBlocker } from 'react-router';

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
        <div className="slur-confirm">
            <div className="slur-panel slur-confirm-box">
                <p>Leave the race in progress?</p>
                <div className="slur-actions">
                    <button type="button" className="slur-btn slur-go" onClick={ () => blocker.proceed() }>
                        Leave
                    </button>
                    <button type="button" className="slur-btn slur-leave" onClick={ () => blocker.reset() }>
                        Stay
                    </button>
                </div>
            </div>
        </div>
    );
}
