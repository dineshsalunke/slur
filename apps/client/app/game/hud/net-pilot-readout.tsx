import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { standingsStore, useSelfFinished, useSelfSpectating } from '../net/standings-store';
import { FlightReadout } from './flight-readout';
import { PowerRack } from './power-rack/power-rack';

export function NetPilotReadout( { room }: { room: Room< RunState > } ) {
    const spectating = useSelfSpectating( room );
    const finished = useSelfFinished( room );
    const clock = useMemo( () => () => room.state.elapsed, [ room ] );
    if ( spectating ) return null;
    return (
        <Fragment>
            { ! finished && <FlightReadout standing={ standingsStore( room ).snapshot } clock={ clock } /> }
            <PowerRack />
        </Fragment>
    );
}
