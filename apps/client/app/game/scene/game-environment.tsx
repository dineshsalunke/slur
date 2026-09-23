import type { Track } from '@slur/shared';
import { Fragment } from 'react';
import { DeepSpaceSky } from './deep-space-sky';
import { Monoliths } from './monoliths';
import { NebulaSky } from './nebula-sky';
import { RockField } from './rock-field';
import { DEEP_SPACE } from './sky-config';

export function GameEnvironment( { track }: { track: Track } ) {
    return (
        <Fragment>
            <NebulaSky />
            <DeepSpaceSky config={ DEEP_SPACE } />
            <RockField />
            <Monoliths track={ track } />
        </Fragment>
    );
}
