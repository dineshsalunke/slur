import { Fragment, useMemo } from 'react';
import { type FrameConfig, type FramePlacement, frameParts, legShape, lintelShape } from '../monolith-frame';
import { MonolithGroup } from '../monolith-group/monolith-group';
import type { RailMask } from '../rail-glow';
import { NO_SEAMS } from './monolith-frames.constants';

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
