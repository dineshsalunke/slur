import { PHASE } from '@slur/shared';
import { Fragment } from 'react';
import { useRoom } from '../../net/room-context';
import { useRunView } from '../net/use-run-view';
import { CountdownOverlay } from './countdown-overlay';
import { HeldPowerChip } from './held-power-chip';
import { LeaveButton } from './leave-button';
import { LeaveGuard } from './leave-guard';
import { LobbyOverlay } from './lobby-overlay';
import { RaceHud } from './race-hud';
import { ResultsOverlay } from './results-overlay';
import { ThreatHud } from './threat-hud';

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
            { /* Countdown + racing have no overlay of their own that hosts Leave (lobby/results embed their
                 own) — without this you're trapped in the run until it finishes. Corner-anchored, clear of
                 the centre timer + right-side standings. */ }
            { ( view.phase === PHASE.countdown || view.phase === PHASE.racing ) && (
                <div className="fixed top-4 left-4 z-[26]">
                    <LeaveButton />
                </div>
            ) }
            { view.phase === PHASE.lobby && <LobbyOverlay room={ room } view={ view } /> }
            { view.phase === PHASE.countdown && <CountdownOverlay seconds={ view.countdown } /> }
            { view.phase === PHASE.racing && <RaceHud view={ view } /> }
            { view.phase === PHASE.racing && <HeldPowerChip room={ room } /> }
            { view.phase === PHASE.racing && <ThreatHud room={ room } /> }
            { view.phase === PHASE.finished && <ResultsOverlay room={ room } view={ view } /> }
        </Fragment>
    );
}
