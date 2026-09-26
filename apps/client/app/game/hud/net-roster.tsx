import type { RunRoomLike } from '../../net/run-room-like';
import { useStandings } from '../net/standings-store';
import { RosterPanel } from './roster-panel';

export function NetRoster( { room }: { room: RunRoomLike } ) {
    const { connected, entries } = useStandings( room );
    return <RosterPanel connected={ connected } entries={ entries } />;
}
