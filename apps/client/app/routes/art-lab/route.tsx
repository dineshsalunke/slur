import { WorldProvider } from 'koota/react';
import { world } from '../../game/ecs/world';
import { ArtLabShell } from './art-lab-shell';

export function meta() {
    return [ { title: 'SLUR — Art Lab' } ];
}

/**
 * `/art-lab` — fly the real track at true scale, to check art decisions that were made against boards
 * drawn at the wrong one (`docs/ART_SCALE_REFERENCE.md` §0: 64u wide, drawn at 6–8u).
 *
 * Keep this hook-free — every knob belongs in `ArtLabShell`.
 */
export default function ArtLabRoute() {
    return (
        <WorldProvider world={ world }>
            <ArtLabShell />
        </WorldProvider>
    );
}
