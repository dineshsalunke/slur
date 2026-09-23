import type { Track } from '@slur/shared';
import { useMemo } from 'react';
import { PILLAR, PILLAR_FIELD, type PillarFieldConfig } from './monolith-config';
import { pillarField } from './monolith-field';
import { MonolithGroup } from './monolith-group';

export function Monoliths( { track, config = PILLAR_FIELD }: { track: Track; config?: PillarFieldConfig } ) {
    const placements = useMemo( () => pillarField( track.finishZ, config ), [ track.finishZ, config ] );
    return <MonolithGroup shape={ PILLAR } placements={ placements } />;
}
