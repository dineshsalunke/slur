import { Fragment, useMemo } from 'react';
import { useTrack } from '../track-context/use-track';
import { monolithLayout } from './arch-field';
import { PILLAR, PILLAR_FIELD, type PillarFieldConfig } from './monolith-config';
import { ARCH_FRAME } from './monolith-frame';
import { MonolithFrames } from './monolith-frames';
import { MonolithGroup } from './monolith-group';
import { bodyTransform, seamTransform } from './monolith-transforms';
import { useRailMask } from './use-rail-mask';

export function Monoliths( { config = PILLAR_FIELD }: { config?: PillarFieldConfig } ) {
    const track = useTrack();
    const layout = useMemo( () => monolithLayout( track.finishZ, config ), [ track.finishZ, config ] );
    const bodies = useMemo( () => layout.pillars.map( ( p ) => bodyTransform( PILLAR, p ) ), [ layout ] );
    const seams = useMemo( () => layout.pillars.map( ( p ) => seamTransform( PILLAR, p ) ), [ layout ] );
    const railMask = useRailMask( track );

    return (
        <Fragment>
            <MonolithGroup shape={ PILLAR } bodies={ bodies } seams={ seams } railMask={ railMask } />
            <MonolithFrames frame={ ARCH_FRAME } placements={ layout.arches } railMask={ railMask } />
        </Fragment>
    );
}
