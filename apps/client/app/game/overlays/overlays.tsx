import { PHASE } from '@slur/shared';
import { Fragment } from 'react';
import { useRoom } from '../../net/room-context';
import { useRunPhase } from '../net/use-run-view';
import { AudioToggle } from './audio-toggle';
import { CountdownOverlay } from './countdown-overlay';
import { HeldPowerChip } from './held-power-chip';
import { LeaveButton } from './leave-button';
import { LeaveGuard } from './leave-guard';
import { LobbyOverlay } from './lobby-overlay';
import { RaceHud } from './race-hud';
import { ResultsOverlay } from './results-overlay';
import { ThreatHud } from './threat-hud';

// A sibling of <NetCanvas> under <GameShell>, so overlay churn never reaches the WebGL scene (acceptance
// gate #1, unchanged). This component subscribes ONLY to `phase` — the lowest-frequency field there is — and
// hands each phase panel the room so the panel owns its own subscription (non-negotiable #10). It
// deliberately does NOT read the run snapshot: that snapshot carries every player's live `z`, so reading it
// here would re-render all the siblings below at patch rate for data they never touch. LeaveGuard is always
// mounted (it guards across phases); the phase overlays are mutually exclusive.
export function Overlays() {
    const room = useRoom();
    const phase = useRunPhase( room );
    return (
        <Fragment>
            <LeaveGuard phase={ phase } />
            { /* Audio toggle is phase-INDEPENDENT — a global preference, not run state — so it stays mounted
                 through lobby/countdown/racing/results. It owns its own subscription (#10), so mounting it
                 here costs this component nothing: a mute change never re-renders Overlays. */ }
            <AudioToggle />

            { /* Countdown + racing have no overlay of their own that hosts Leave (lobby/results embed their
                 own) — without this you're trapped in the run until it finishes. Corner-anchored, clear of
                 the centre timer + right-side standings. */ }
            { ( phase === PHASE.countdown || phase === PHASE.racing ) && (
                <div className="fixed top-4 left-4 z-[26]">
                    <LeaveButton />
                </div>
            ) }
            { phase === PHASE.lobby && <LobbyOverlay room={ room } /> }
            { phase === PHASE.countdown && <CountdownOverlay room={ room } /> }
            { phase === PHASE.racing && <RaceHud room={ room } /> }
            { phase === PHASE.racing && <HeldPowerChip room={ room } /> }
            { phase === PHASE.racing && <ThreatHud room={ room } /> }
            { phase === PHASE.finished && <ResultsOverlay room={ room } /> }
        </Fragment>
    );
}
