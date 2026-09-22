import type { Track } from '@slur/shared';
import { Fragment } from 'react';
import { DeepSpaceSky } from './deep-space-sky';
import type { EnvConfig } from './env-config';
import { Monoliths } from './monoliths';
import { DEEP_SPACE } from './sky-config';

export function GameEnvironment( { config, track }: { config: EnvConfig; track: Track } ) {
    return (
        <Fragment>
            <color attach="background" args={ [ config.background ] } />
            <DeepSpaceSky config={ DEEP_SPACE } light={ false } environment={ false } />
            <Monoliths track={ track } />
        </Fragment>
    );
}
