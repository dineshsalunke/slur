import { PHASE } from '@slur/shared';
import { Fragment } from 'react';
import { useRoom } from '../../net/room-context';
import { useRunView } from '../net/use-run-view';
import './overlays.css';
import { CountdownOverlay } from './countdown-overlay';
import { HeldPowerChip } from './held-power-chip';
import { LeaveGuard } from './leave-guard';
import { LobbyOverlay } from './lobby-overlay';
import { RaceHud } from './race-hud';
import { ResultsOverlay } from './results-overlay';

// The ONLY DOM subscriber to run state (acceptance gate #1) — a sibling of <NetCanvas> under <GameShell>, so
// its re-renders (up to 20Hz, driven by `elapsed`) never reach the WebGL scene. Reads the snapshot via
// useRunView (schema→React bridge) and phase-switches the overlay. LeaveGuard is always mounted (it guards
// across phases); the phase overlays are mutually exclusive.
export function Overlays() {
    const room = useRoom();
    const view = useRunView( room );
    return (
        <Fragment>
            <LeaveGuard phase={ view.phase } />
            { view.phase === PHASE.lobby && <LobbyOverlay room={ room } view={ view } /> }
            { view.phase === PHASE.countdown && <CountdownOverlay seconds={ view.countdown } /> }
            { view.phase === PHASE.racing && <RaceHud view={ view } /> }
            { view.phase === PHASE.racing && <HeldPowerChip room={ room } /> }
            { view.phase === PHASE.finished && <ResultsOverlay room={ room } view={ view } /> }
        </Fragment>
    );
}
