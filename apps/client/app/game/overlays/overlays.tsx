import { PHASE } from '@slur/shared';
import { Fragment } from 'react';
import { useRoom } from '../../net/room-context';
import { useRunPhase } from '../net/use-run-view';
import { AudioToggle } from './audio-toggle';
import { CountdownOverlay } from './countdown-overlay';
import { LeaveButton } from './leave-button';
import { LeaveGuard } from './leave-guard';
import { LobbyOverlay } from './lobby-overlay';
import { RaceHud } from './race-hud';
import { ResultsOverlay } from './results-overlay';
import { ThreatHud } from './threat-hud';

export function Overlays() {
    const room = useRoom();
    const phase = useRunPhase( room );
    return (
        <Fragment>
            <LeaveGuard phase={ phase } />
            <AudioToggle />

            { ( phase === PHASE.countdown || phase === PHASE.racing ) && (
                <div className="fixed top-4 left-4 z-[26]">
                    <LeaveButton />
                </div>
            ) }
            { phase === PHASE.lobby && <LobbyOverlay room={ room } /> }
            { phase === PHASE.countdown && <CountdownOverlay room={ room } /> }
            { phase === PHASE.racing && <RaceHud room={ room } /> }
            { phase === PHASE.racing && <ThreatHud room={ room } /> }
            { phase === PHASE.finished && <ResultsOverlay room={ room } /> }
        </Fragment>
    );
}
