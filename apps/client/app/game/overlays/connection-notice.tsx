import { useNavigate } from 'react-router';
import { useConnectionStatus } from '../../net/connection-status';
import { HudButton } from '../../ui/hud-button/hud-button';
import { HudPanel } from '../../ui/hud-panel/hud-panel';

export function ConnectionNotice() {
    const status = useConnectionStatus();
    const navigate = useNavigate();
    if ( status === 'reconnecting' ) {
        return (
            <div className="pointer-events-none fixed inset-x-0 top-[clamp(16px,4.4vh,46px)] z-40 flex justify-center">
                <HudPanel accent="gold" className="px-4 py-2 text-[13px] uppercase tracking-[2px]">
                    Reconnecting…
                </HudPanel>
            </div>
        );
    }
    if ( status !== 'lost' ) return null;
    return (
        <div className="pointer-events-auto fixed inset-0 z-40 grid place-items-center bg-void/55">
            <HudPanel accent="magenta" className="px-3.5 py-3 text-center">
                <p className="my-4">Connection to the run was lost.</p>
                <div className="flex justify-center">
                    <HudButton variant="go" onClick={ () => navigate( '/' ) }>
                        Back to menu
                    </HudButton>
                </div>
            </HudPanel>
        </div>
    );
}
