import type { Track } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { MONOLITH_FIELD, MONOLITH_SHAPES, type MonolithFieldConfig, type MonolithShapeName } from './monolith-config';
import { type MonolithPlacement, monolithField } from './monolith-field';
import { MonolithGroup } from './monolith-group';
import { shapeAt } from './monolith-transforms';

function groupByShape(
    placements: readonly MonolithPlacement[],
    shapes: readonly MonolithShapeName[],
): [ MonolithShapeName, MonolithPlacement[] ][] {
    const groups = new Map< MonolithShapeName, MonolithPlacement[] >();
    for ( const p of placements ) {
        const name = shapeAt( p.z, p.side, shapes );
        const bucket = groups.get( name );
        if ( bucket ) bucket.push( p );
        else groups.set( name, [ p ] );
    }
    return [ ...groups ];
}

export function Monoliths( { track, config = MONOLITH_FIELD }: { track: Track; config?: MonolithFieldConfig } ) {
    const groups = useMemo( () => {
        const placements = monolithField( track.finishZ, config );
        return groupByShape( placements, config.shapes );
    }, [ track.finishZ, config ] );

    return (
        <Fragment>
            { groups.map( ( [ name, placements ] ) => (
                <MonolithGroup key={ name } shape={ MONOLITH_SHAPES[ name ] } placements={ placements } />
            ) ) }
        </Fragment>
    );
}
