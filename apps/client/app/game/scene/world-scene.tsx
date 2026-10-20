import { Fragment, type ReactNode, Suspense } from 'react';
import { RenderScale } from '../../dev/render-scale';
import { BlackHole } from './black-hole/black-hole';
import { ExhaustField } from './exhaust-field/exhaust-field';
import { ExplosionField } from './explosion-field/explosion-field';
import { GameEnvironment } from './game-environment';
import { HitSpark } from './hit-spark/hit-spark';
import { SceneEffects } from './post/scene-effects/scene-effects';
import { SceneEnvironment } from './scene-environment';
import { Ships } from './ships';
import { FinishGate } from './track/finish-gate/finish-gate';
import { TrackView } from './track/track-view';

export function WorldScene( { children }: { children?: ReactNode } ) {
    return (
        <Fragment>
            <GameEnvironment />
            <SceneEnvironment />
            <RenderScale />
            <ExplosionField />
            <ExhaustField />
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
