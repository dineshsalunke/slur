import type { Track } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { ASTEROID_BANDS } from './asteroid-config';
import { asteroidField } from './asteroid-field';
import { asteroidGeometry } from './asteroid-geometry';
import { AsteroidGroup } from './asteroid-group';

const FIELD_START = -80;
const FIELD_MARGIN = 400;

export function Asteroids( { track }: { track: Track } ) {
    const groups = useMemo(
        () =>
            ASTEROID_BANDS.flatMap( ( band ) => {
                const field = asteroidField( band, FIELD_START, track.finishZ + FIELD_MARGIN );

                return Array.from( { length: band.variants }, ( _, variant ) => ( {
                    name: `${ band.name }:${ variant }`,
                    geometry: asteroidGeometry( variant, band.detail ),
                    placements: field.filter( ( p ) => p.variant === variant ),
                } ) ).filter( ( group ) => group.placements.length > 0 );
            } ),
        [ track.finishZ ],
    );

    return (
        <Fragment>
            { groups.map( ( { name, geometry, placements } ) => (
                <AsteroidGroup key={ name } geometry={ geometry } placements={ placements } />
            ) ) }
        </Fragment>
    );
}
