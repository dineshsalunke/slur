import type { Track } from '@slur/shared';
import { Fragment, type ReactNode } from 'react';
import { RenderScale } from '../../dev/render-scale';
import { BackFill } from './back-fill';
import { EngineLight } from './engine-light';
import { ExhaustField } from './exhaust-field';
import { ExplosionField } from './explosions';
import { FinishGate } from './finish-gate';
import { GameEnvironment } from './game-environment';
import { HitSpark } from './hit-spark';
import { NearFill } from './near-fill';
import { RailLights } from './rail-lights';
import { SceneEffects } from './scene-effects';
import { SceneEnvironment } from './scene-environment';
import { SceneFog } from './scene-fog';
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
            <SceneEnvironment />
            <SceneFog />
            <BackFill />
            <NearFill />
            <RailLights track={ track } />
            <RenderScale />
            <EngineLight />
            <ExplosionField />
            <ExhaustField />
            <HitSpark />
            <TrackView track={ track } />
            <FinishGate track={ track } />
            <Ships track={ track } />
            { children }
            <SceneEffects />
        </Fragment>
    );
}
