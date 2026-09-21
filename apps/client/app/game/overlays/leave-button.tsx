import { useNavigate } from 'react-router';
import { leaveRoom } from '../../net/matchmaking';
import { HudButton } from '../../ui/hud-button';

export function LeaveButton() {
    const navigate = useNavigate();
    const onLeave = () => {
        leaveRoom();
        navigate( '/' );
    };
    return (
        <HudButton variant="leave" onClick={ onLeave }>
            Leave
        </HudButton>
    );
}
