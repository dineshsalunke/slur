import { Fragment } from 'react';
import { QualityGate } from '../../quality/quality-gate/quality-gate';
import { MeteorScorch } from './meteor-scorch/meteor-scorch';
import { Monoliths } from './monoliths';
import { RockField } from './rock-field/rock-field';
import { SceneBackdrop } from './scene-backdrop/scene-backdrop';

export function GameEnvironment() {
    return (
        <Fragment>
            <SceneBackdrop />
            <QualityGate feature="rocks">
                <RockField />
            </QualityGate>
            <MeteorScorch />
            <Monoliths />
        </Fragment>
    );
}
