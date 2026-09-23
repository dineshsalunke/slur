import { Fragment, useMemo } from 'react';
import { type FrameConfig, type FramePlacement, frameParts, legShape, lintelShape } from './monolith-frame';
import { MonolithGroup } from './monolith-group';
import type { MonolithTransform } from './monolith-transforms';
import type { RailMask } from './rail-glow';

const NO_SEAMS: readonly MonolithTransform[] = [];

export function MonolithFrames( {
    frame,
    placements,
    railMask,
}: {
    frame: FrameConfig;
    placements: readonly FramePlacement[];
    railMask?: RailMask;
} ) {
    const parts = useMemo( () => frameParts( frame, placements ), [ frame, placements ] );
    const leg = useMemo( () => legShape( frame ), [ frame ] );
    const lintel = useMemo( () => lintelShape( frame ), [ frame ] );
    return (
        <Fragment>
            <MonolithGroup shape={ leg } bodies={ parts.legs } seams={ parts.seams } railMask={ railMask } />
            <MonolithGroup shape={ lintel } bodies={ parts.lintels } seams={ NO_SEAMS } railMask={ railMask } />
        </Fragment>
    );
}
