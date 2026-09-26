import { Fragment, type ReactNode } from 'react';
import { RenderScale } from '../../dev/render-scale';
import { BackFill } from './back-fill/back-fill';
import { BoostStreaks } from './boost-streaks';
import { EngineLight } from './engine-light/engine-light';
import { ExhaustField } from './exhaust-field/exhaust-field';
import { ExplosionField } from './explosion-field/explosion-field';
import { FinishGate } from './finish-gate/finish-gate';
import { GameEnvironment } from './game-environment';
import { HitSpark } from './hit-spark/hit-spark';
import { NearFill } from './near-fill/near-fill';
import { SceneEffects } from './scene-effects';
import { SceneEnvironment } from './scene-environment';
import { Ships } from './ships';
import { TrackView } from './track-view';

export function WorldScene( { children }: { children?: ReactNode } ) {
    return (
        <Fragment>
            <GameEnvironment />
            <SceneEnvironment />
            <BackFill />
            <NearFill />
            <RenderScale />
            <EngineLight />
            <ExplosionField />
            <ExhaustField />
            <BoostStreaks />
            <HitSpark />
            <TrackView />
            <FinishGate />
            <Ships />
            { children }
            <SceneEffects />
        </Fragment>
    );
}
