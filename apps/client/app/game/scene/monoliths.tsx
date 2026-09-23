import type { Track } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { monolithLayout } from './arch-field';
import { PILLAR, PILLAR_FIELD, type PillarFieldConfig } from './monolith-config';
import { ARCH_FRAME } from './monolith-frame';
import { MonolithFrames } from './monolith-frames';
import { MonolithGroup } from './monolith-group';
import { bodyTransform, seamTransform } from './monolith-transforms';

export function Monoliths( { track, config = PILLAR_FIELD }: { track: Track; config?: PillarFieldConfig } ) {
    const layout = useMemo( () => monolithLayout( track.finishZ, config ), [ track.finishZ, config ] );
    const bodies = useMemo( () => layout.pillars.map( ( p ) => bodyTransform( PILLAR, p ) ), [ layout ] );
    const seams = useMemo( () => layout.pillars.map( ( p ) => seamTransform( PILLAR, p ) ), [ layout ] );
    return (
        <Fragment>
            <MonolithGroup shape={ PILLAR } bodies={ bodies } seams={ seams } />
            <MonolithFrames frame={ ARCH_FRAME } placements={ layout.arches } />
        </Fragment>
    );
}
