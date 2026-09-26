import { Fragment } from 'react';
import { useRoom } from '../../net/room-context/use-room';
import { PhaseGate } from '../phase-gate/phase-gate';
import {
    COUNTDOWN_PHASES,
    FINISHED_PHASES,
    LOBBY_PHASES,
    ON_TRACK_PHASES,
    RACING_PHASES,
} from '../phase-gate/phase-gate.constants';
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
    return (
        <Fragment>
            <LeaveGuard />
            <ConnectionNotice />

            <PhaseGate phases={ ON_TRACK_PHASES }>
                <div className="fixed top-[clamp(16px,4.4vh,46px)] right-[clamp(16px,2.7vw,48px)] z-[26] flex items-center gap-2">
                    <FullscreenToggle />
                    <AudioToggle />
                    <LeaveButton tone="ghost" />
                </div>
                <RotateHint />
            </PhaseGate>
            <PhaseGate phases={ LOBBY_PHASES }>
                <LobbyOverlay room={ room } />
            </PhaseGate>
            <PhaseGate phases={ COUNTDOWN_PHASES }>
                <CountdownOverlay room={ room } />
            </PhaseGate>
            <PhaseGate phases={ RACING_PHASES }>
                <SpectatorGate room={ room } />
                <ThreatHud room={ room } />
            </PhaseGate>
            <PhaseGate phases={ FINISHED_PHASES }>
                <ResultsOverlay room={ room } />
            </PhaseGate>
        </Fragment>
    );
}
