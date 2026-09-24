import { PHASE, type Track } from '@slur/shared';
import { Fragment } from 'react';
import { useRoom } from '../net/room-context';
import { HudLayer } from './hud/hud-layer';
import { NetPilotReadout } from './hud/net-pilot-readout';
import { NetRoster } from './hud/net-roster';
import { TouchPad } from './hud/touch-pad';
import { useRunPhase } from './net/use-run-view';

export function NetHud( { track }: { track: Track } ) {
    const room = useRoom();
    const phase = useRunPhase( room );
    if ( phase !== PHASE.countdown && phase !== PHASE.racing ) return null;
    return (
        <Fragment>
            <HudLayer>
                <NetRoster room={ room } />
                <NetPilotReadout room={ room } track={ track } />
            </HudLayer>
            <TouchPad />
        </Fragment>
    );
}
