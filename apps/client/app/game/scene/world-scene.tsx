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
import { SceneEffects } from './scene-effects';
import { SceneEnvironment } from './scene-environment';
import { Ships } from './ship';
import { TrackView } from './track-view';

export function WorldScene( { track, children }: { track: Track; children?: ReactNode } ) {
    return (
        <Fragment>
            <GameEnvironment track={ track } />
            <SceneEnvironment />
            <BackFill />
            <NearFill />
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
