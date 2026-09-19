import { WorldProvider } from 'koota/react';
import { world } from '../../game/ecs/world';
import { ArtLabShell } from './art-lab-shell';

export function meta() {
    return [ { title: 'SLUR — Art Lab' } ];
}

/**
 * `/art-lab` — the art review instrument.
 *
 * Fly the REAL generated track with the REAL chase camera and REAL collision, at true scale, with the
 * knobs an art review actually needs. No server, no room — `resolveTrack` is pure and `simulate()` takes
 * the track as an argument.
 *
 * WHY THIS EXISTS: the art direction was drawn against concept boards at the wrong scale — the track is
 * 64u wide and the boards drew it at 6–8u (`docs/ART_SCALE_REFERENCE.md` §0). This route is where those
 * decisions get checked against the thing that ships.
 *
 * Hook-free on purpose: every knob lives in `ArtLabShell` below, so a route-level re-render cannot
 * reconcile the scene subtree.
 */
export default function ArtLabRoute() {
    return (
        <WorldProvider world={ world }>
            <ArtLabShell />
        </WorldProvider>
    );
}
