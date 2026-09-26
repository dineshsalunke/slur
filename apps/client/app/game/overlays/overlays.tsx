import { PHASE } from '@slur/shared';
import { Fragment } from 'react';
import { useRoom } from '../../net/room-context/use-room';
import { useRunPhase } from '../net/run-view-store';
import { AudioToggle } from './audio-toggle';
import { ConnectionNotice } from './connection-notice';
import { CountdownOverlay } from './countdown-overlay';
import { FullscreenToggle } from './fullscreen-toggle';
import { LeaveButton } from './leave-button';
import { LeaveGuard } from './leave-guard';
import { LobbyOverlay } from './lobby-overlay';
import { ResultsOverlay } from './results-overlay';
import { RotateHint } from './rotate-hint';
import { SpectatorGate } from './spectator-gate';
import { ThreatHud } from './threat-hud/threat-hud';

export function Overlays() {
    const room = useRoom();
    const phase = useRunPhase( room );
    return (
        <Fragment>
            <LeaveGuard phase={ phase } />
            <ConnectionNotice />

            { ( phase === PHASE.countdown || phase === PHASE.racing ) && (
                <div className="fixed top-[clamp(16px,4.4vh,46px)] right-[clamp(16px,2.7vw,48px)] z-[26] flex items-center gap-2">
                    <FullscreenToggle />
                    <AudioToggle />
                    <LeaveButton tone="ghost" />
                </div>
            ) }
            { ( phase === PHASE.countdown || phase === PHASE.racing ) && <RotateHint /> }
            { phase === PHASE.lobby && <LobbyOverlay room={ room } /> }
            { phase === PHASE.countdown && <CountdownOverlay room={ room } /> }
            { phase === PHASE.racing && <SpectatorGate room={ room } /> }
            { phase === PHASE.racing && <ThreatHud room={ room } /> }
            { phase === PHASE.finished && <ResultsOverlay room={ room } /> }
        </Fragment>
    );
}
