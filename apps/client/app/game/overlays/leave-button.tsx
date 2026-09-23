import { useNavigate } from 'react-router';
import { leaveRoom } from '../../net/matchmaking';
import { HudButton } from '../../ui/hud-button';

const GHOST =
    'h-9 cursor-pointer border border-readout/25 bg-deep/60 px-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-readout transition-colors duration-150 hover:border-readout/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-readout';

export function LeaveButton( { tone = 'hud' }: { tone?: 'hud' | 'ghost' } ) {
    const navigate = useNavigate();
    const onLeave = () => {
        leaveRoom();
        navigate( '/' );
    };
    if ( tone === 'ghost' ) {
        return (
            <button type="button" className={ GHOST } onClick={ onLeave }>
                Leave
            </button>
        );
    }
    return (
        <HudButton variant="leave" onClick={ onLeave }>
            Leave
        </HudButton>
    );
}
