import { Fragment } from 'react';
import { QualityLatch } from '../../quality/quality-latch/quality-latch';
import { MeteorScorch } from './meteor-scorch/meteor-scorch';
import { Monoliths } from './monoliths';
import { RockField } from './rock-field/rock-field';
import { SceneBackdrop } from './scene-backdrop/scene-backdrop';

export function GameEnvironment() {
    return (
        <Fragment>
            <SceneBackdrop />
            <QualityLatch feature="rocks">
                <RockField />
            </QualityLatch>
            <MeteorScorch />
            <Monoliths />
        </Fragment>
    );
}
