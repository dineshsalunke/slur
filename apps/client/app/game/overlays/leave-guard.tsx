import { PHASE } from '@slur/shared';
import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { useConnectionStatus } from '../../net/connection-status';
import { HudButton } from '../../ui/hud-button/hud-button';
import { HudPanel } from '../../ui/hud-panel/hud-panel';

export function LeaveGuard( { phase }: { phase: number } ) {
    const connected = useConnectionStatus() !== 'lost';
    const racing = phase === PHASE.racing && connected;
    const blocker = useBlocker( racing );

    // JUSTIFIED EFFECT — syncs with an external system: the browser's beforeunload (hard tab close/reload),
    useEffect( () => {
        if ( ! racing ) return;
        const onBeforeUnload = ( e: BeforeUnloadEvent ) => {
            e.preventDefault();
            e.returnValue = '';
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
