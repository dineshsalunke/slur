import { PHASE, ROOM_NAME } from '@slur/shared';
import { useNavigation } from 'react-router';
import { useLobbyRooms } from '../../../lobby/lobby-store';
import { LABEL } from '../../../ui/field-label/field-label.constants';
import { PHASE_VIEW, SECONDARY_BUTTON } from './quick-play.constants';

export function QuickPlay() {
    const room = useLobbyRooms().find( ( r ) => r.name === ROOM_NAME );
    const navigation = useNavigation();
    const busy = navigation.state !== 'idle';
    const joining = busy && navigation.formData?.get( 'intent' ) === 'quick';
    const view = PHASE_VIEW[ room?.metadata?.phase ?? PHASE.lobby ] ?? PHASE_VIEW[ PHASE.lobby ];

    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <p id="quick-play-status" className={ `m-0 flex ${ LABEL }` }>
                <span className="flex items-center gap-2">
                    { room && view.live ? <span className="pulse-dot size-1.5 bg-readout" aria-hidden="true" /> : null }
                    { room
                        ? `Open run · ${ room.clients } ${ room.clients === 1 ? 'racer' : 'racers' } · ${ view.label }`
                        : 'Open run · nobody yet' }
                </span>
            </p>
            <button
                type="submit"
                name="intent"
                value="quick"
                disabled={ busy }
                aria-describedby="quick-play-status"
                className={ `${ SECONDARY_BUTTON } w-full sm:w-auto` }
            >
                { joining ? 'Joining…' : 'Quick play' }
            </button>
        </div>
    );
}
