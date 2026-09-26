import { useMemo } from 'react';
import type { RunRoomLike } from '../../net/run-room-like';
import { standingsStore, useSelfFinished, useSelfSpectating } from '../net/standings-store';
import { FlightReadout } from './flight-readout';

export function NetFlightReadout( { room }: { room: RunRoomLike } ) {
    const spectating = useSelfSpectating( room );
    const finished = useSelfFinished( room );
    const clock = useMemo( () => () => room.state.elapsed, [ room ] );
    if ( spectating || finished ) return null;
    return <FlightReadout standing={ standingsStore( room ).snapshot } clock={ clock } />;
}
