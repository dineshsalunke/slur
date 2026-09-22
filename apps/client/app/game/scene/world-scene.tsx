import { EffectComposer } from '@react-three/postprocessing';
import type { Track } from '@slur/shared';
import { Fragment, type ReactNode } from 'react';
import { ExposureTuning } from '../../dev/exposure-tuning';
import { RenderScale } from '../../dev/render-scale';
import { ToneTuning } from '../../dev/tone-tuning';
import { ExplosionField } from './explosions';
import { FinishGate } from './finish-gate';
import { GameEnvironment } from './game-environment';
import { HitSpark } from './hit-spark';
import { SceneLighting } from './lighting';
import { SceneBloom } from './scene-bloom';
import { Ships } from './ship';
import { TrackView } from './track-view';

export function WorldScene( {
    track,
    blocks = true,
    children,
}: {
    track: Track;
    blocks?: boolean;
    children?: ReactNode;
} ) {
    return (
        <Fragment>
            <GameEnvironment track={ track } />
            <SceneLighting />
            <RenderScale />
            <ExplosionField />
            <HitSpark />
            <TrackView track={ track } />
            <FinishGate track={ track } />
            <Ships />
            { children }
            <EffectComposer multisampling={ 0 }>
                <ExposureTuning />
                <SceneBloom />
                <ToneTuning />
            </EffectComposer>
        </Fragment>
    );
}
