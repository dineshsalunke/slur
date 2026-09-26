import { Fragment } from 'react';
import { DeepSpaceSky } from './deep-space-sky/deep-space-sky';
import { MeteorScorch } from './meteor-scorch/meteor-scorch';
import { Monoliths } from './monoliths';
import { NebulaSky } from './nebula-sky';
import { RockField } from './rock-field/rock-field';
import { DEEP_SPACE } from './sky-config';

export function GameEnvironment() {
    return (
        <Fragment>
            <NebulaSky />
            <DeepSpaceSky config={ DEEP_SPACE } />
            <RockField />
            <MeteorScorch />
            <Monoliths />
        </Fragment>
    );
}
