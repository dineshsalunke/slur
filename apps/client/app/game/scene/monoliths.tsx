import { LEAD_SEGMENTS, type Track } from '@slur/shared';
import { Fragment, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { monolithLayout } from './arch-field';
import { PILLAR, PILLAR_FIELD, type PillarFieldConfig } from './monolith-config';
import { ARCH_FRAME } from './monolith-frame';
import { MonolithFrames } from './monolith-frames';
import { MonolithGroup, unattached } from './monolith-group';
import { bodyTransform, seamTransform } from './monolith-transforms';
import { type RailMask, railMaskData } from './rail-glow';
import { segmentCount } from './track-floor';
import { buildRailRuns } from './track-rails';

export function Monoliths( { track, config = PILLAR_FIELD }: { track: Track; config?: PillarFieldConfig } ) {
    const layout = useMemo( () => monolithLayout( track.finishZ, config ), [ track.finishZ, config ] );
    const bodies = useMemo( () => layout.pillars.map( ( p ) => bodyTransform( PILLAR, p ) ), [ layout ] );
    const seams = useMemo( () => layout.pillars.map( ( p ) => seamTransform( PILLAR, p ) ), [ layout ] );
    const mask = useMemo( () => {
        const segments = segmentCount( track );
        return { ...railMaskData( buildRailRuns( track, segments ), segments ), count: segments + LEAD_SEGMENTS };
    }, [ track ] );
    const maskRef = useRef< THREE.DataTexture | null >( null );
    const railMask = useMemo< RailMask >( () => ( { texture: maskRef, count: mask.count } ), [ mask.count ] );

    return (
        <Fragment>
            <dataTexture
                ref={ maskRef }
                args={ [ mask.data, mask.width, mask.rows, THREE.RGBAFormat, THREE.FloatType ] }
                attach={ unattached }
                needsUpdate
            />
            <MonolithGroup shape={ PILLAR } bodies={ bodies } seams={ seams } railMask={ railMask } />
            <MonolithFrames frame={ ARCH_FRAME } placements={ layout.arches } railMask={ railMask } />
        </Fragment>
    );
}
