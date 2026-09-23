import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useStandings } from '../net/standings-store';
import { RosterPanel } from './roster-panel';

export function NetRoster( { room }: { room: Room< RunState > } ) {
    const { connected, entries } = useStandings( room );
    return <RosterPanel connected={ connected } entries={ entries } />;
}
