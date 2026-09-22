import type { Track } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { ASTEROID_BANDS } from './asteroid-config';
import { asteroidField } from './asteroid-field';
import { AsteroidGroup } from './asteroid-group';

const FIELD_START = -80;
const FIELD_MARGIN = 400;

export function Asteroids( { track }: { track: Track } ) {
    const bands = useMemo(
        () =>
            ASTEROID_BANDS.map( ( band ) => ( {
                name: band.name,
                placements: asteroidField( band, FIELD_START, track.finishZ + FIELD_MARGIN ),
            } ) ),
        [ track.finishZ ],
    );

    return (
        <Fragment>
            { bands.map( ( { name, placements } ) => (
                <AsteroidGroup key={ name } placements={ placements } />
            ) ) }
        </Fragment>
    );
}
