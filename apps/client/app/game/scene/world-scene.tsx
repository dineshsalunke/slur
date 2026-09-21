import { EffectComposer } from '@react-three/postprocessing';
import type { Track } from '@slur/shared';
import { Fragment, type ReactNode } from 'react';
import { TunedBloom } from '../../dev/tuned-bloom';
import { GRID_VOID } from './env-config';
import { ExplosionField } from './explosions';
import { FinishGate } from './finish-gate';
import { GameEnvironment } from './game-environment';
import { HitSpark } from './hit-spark';
import { SceneLighting } from './lighting';
import { Ships } from './ship';
import { TrackView } from './track-view';

export function WorldScene( { track, children }: { track: Track; children?: ReactNode } ) {
    return (
        <Fragment>
            <GameEnvironment config={ GRID_VOID } track={ track } />
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
