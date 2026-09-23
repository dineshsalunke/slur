import type { Room } from '@colyseus/sdk';
import type { RunState, Track } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { standingsStore, useSelfSpectating } from '../net/standings-store';
import { FlightReadout } from './flight-readout';
import { PowerRack } from './power-rack';

export function NetPilotReadout( { room, track }: { room: Room< RunState >; track: Track } ) {
    const spectating = useSelfSpectating( room );
    const clock = useMemo( () => () => room.state.elapsed, [ room ] );
    if ( spectating ) return null;
    return (
        <Fragment>
            <FlightReadout track={ track } standing={ standingsStore( room ).snapshot } clock={ clock } />
            <PowerRack />
        </Fragment>
    );
}
