import { Fragment, type ReactNode, Suspense } from 'react';
import { RenderScale } from '../../dev/render-scale';
import { BlackHole } from './black-hole/black-hole';
import { BoostStreaks } from './boost-streaks/boost-streaks';
import { ExhaustField } from './exhaust-field/exhaust-field';
import { ExplosionField } from './explosion-field/explosion-field';
import { FinishGate } from './finish-gate/finish-gate';
import { GameEnvironment } from './game-environment';
import { HitSpark } from './hit-spark/hit-spark';
import { SceneEffects } from './scene-effects/scene-effects';
import { SceneEnvironment } from './scene-environment';
import { Ships } from './ships';
import { TrackView } from './track-view';

export function WorldScene( { children }: { children?: ReactNode } ) {
    return (
        <Fragment>
            <GameEnvironment />
            <SceneEnvironment />
            <RenderScale />
            <ExplosionField />
            <ExhaustField />
            <BoostStreaks />
            <HitSpark />
            <TrackView />
            <FinishGate />
            <Suspense fallback={ null }>
                <BlackHole />
            </Suspense>
            <Ships />
            { children }
            <SceneEffects />
        </Fragment>
    );
}
