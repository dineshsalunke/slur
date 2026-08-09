import { useNavigate } from 'react-router';
import { leaveRoom } from '../../net/matchmaking';

// The DELIBERATE Leave action: tear the room down (the only place we close it) then navigate home. Room
// teardown lives in matchmaking.leaveRoom (module singleton), NEVER an unmount cleanup (the S2 bug / gate #6).
export function LeaveButton() {
    const navigate = useNavigate();
    const onLeave = () => {
        leaveRoom();
        navigate( '/' );
    };
    return (
        <button type="button" className="slur-btn slur-leave" onClick={ onLeave }>
            Leave
        </button>
    );
}
