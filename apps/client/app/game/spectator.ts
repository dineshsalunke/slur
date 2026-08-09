import { PHASE } from '@slur/shared';

// Loop↔UI seams kept OUTSIDE React — read by the R3F useFrame loop EVERY frame, written by the DOM (Tab / ◀▶)
// and the Colyseus→ECS bridge. Same idiom as input/keyboard.ts: prop-drilling these into <NetLoop> would force
// the WebGL parent to re-render on every change (acceptance gate #3). They are plain module singletons.

// Mirrored from PlayerState.spectating by the ECS bridge (net-canvas.tsx local onChange). The loop reads it to
// (a) freeze prediction and (b) switch to the spectator camera; net-systems hides the local ship while true.
export const localRole = { spectating: false };

// Which racer the spectator camera follows. null → the loop falls back to the leader (furthest z).
export const spectatorCam = { targetSessionId: null as string | null };

// Current run phase, mirrored from RunState.phase by the bridge. The loop reads it to pick the camera mode
// (lobby hero-orbit vs chase) and to predict ONLY while racing — without a React subscription.
export const runPhase = { value: PHASE.lobby as number };

// Cycle the spectator target through the live racer ids (◀▶ / Tab). Wraps both directions; an absent current
// target starts from the appropriate end. No-op (clears) when there are no racers to watch.
export function cycleSpectatorTarget( racerIds: string[], dir: 1 | -1 = 1 ): void {
    if ( racerIds.length === 0 ) {
        spectatorCam.targetSessionId = null;
        return;
    }
    const i = racerIds.indexOf( spectatorCam.targetSessionId ?? '' );
    spectatorCam.targetSessionId = racerIds[ ( ( i < 0 ? -dir : i ) + dir + racerIds.length ) % racerIds.length ];
}
