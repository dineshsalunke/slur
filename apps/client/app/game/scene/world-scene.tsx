import { EffectComposer } from '@react-three/postprocessing';
import type { Track } from '@slur/shared';
import { Fragment, type ReactNode } from 'react';
import { TunedBloom } from '../../dev/tuned-bloom';
import { GRID_VOID } from './env-config';
import { Environment } from './environment';
import { ExplosionField } from './explosions';
import { FinishGate } from './finish-gate';
import { HitSpark } from './hit-spark';
import { SceneLighting } from './lighting';
import { Ships } from './ship';
import { TrackView } from './track-view';

export function WorldScene( { track, wallSeed, children }: { track: Track; wallSeed?: number; children?: ReactNode } ) {
    return (
        <Fragment>
            <Environment config={ GRID_VOID } seed={ wallSeed } />
            <SceneLighting />
            <ExplosionField />
            <HitSpark />
            <TrackView track={ track } />
            <FinishGate track={ track } />
            <Ships />
            { children }
            <EffectComposer multisampling={ 0 }>
                <TunedBloom config={ GRID_VOID.bloom } />
            </EffectComposer>
        </Fragment>
    );
}
