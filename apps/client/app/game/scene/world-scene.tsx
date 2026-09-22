import type { Track } from '@slur/shared';
import { Fragment, type ReactNode } from 'react';
import { RenderScale } from '../../dev/render-scale';
import { ExplosionField } from './explosions';
import { FinishGate } from './finish-gate';
import { GameEnvironment } from './game-environment';
import { HitSpark } from './hit-spark';
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
            <RenderScale />
            <ExplosionField />
            <HitSpark />
            <TrackView track={ track } />
            <FinishGate track={ track } />
            <Ships />
            { children }
        </Fragment>
    );
}
