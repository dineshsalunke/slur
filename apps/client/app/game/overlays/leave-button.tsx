import { useNavigate } from 'react-router';
import { leaveRoom } from '../../net/matchmaking';
import { GHOST, keepFocusOff } from '../../ui/ghost';
import { HudButton } from '../../ui/hud-button';

export function LeaveButton( { tone = 'hud' }: { tone?: 'hud' | 'ghost' } ) {
    const navigate = useNavigate();
    const onLeave = () => {
        leaveRoom();
        navigate( '/' );
    };
    if ( tone === 'ghost' ) {
        return (
            <button type="button" className={ `${ GHOST } px-4` } onMouseDown={ keepFocusOff } onClick={ onLeave }>
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
