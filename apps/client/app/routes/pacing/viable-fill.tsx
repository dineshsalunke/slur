import { PACING_DZ } from '@slur/shared';
import { Fragment } from 'react';
import { usePacingReport } from './pacing-report-context';
import { deadEndRegions, viableShapes } from './route-lines';

export function ViableFill() {
    const report = usePacingReport();
    const { cruise, routes } = report;
    if ( ! routes ) return null;
    const t = ( k: number ): number => ( k * PACING_DZ ) / cruise;
    return (
        <Fragment>
            { viableShapes( report ).map( ( s ) => (
                <polygon key={ s.key } points={ s.points } className={ s.air ? 'fill-gold/15' : 'fill-cyan/10' } />
            ) ) }
            { deadEndRegions( report ).map( ( r ) => (
                <rect
                    key={ `d${ r.k0 }:${ r.x0 }` }
                    x={ t( r.k0 ) }
                    y={ -r.x1 }
                    width={ t( r.k1 + 1 - r.k0 ) }
                    height={ Math.max( 0.3, r.x1 - r.x0 ) }
                    className="fill-threat/25"
                />
            ) ) }
            { routes.conditional.map( ( r ) => (
                <rect
                    key={ `c${ r.k0 }:${ r.x0 }` }
                    x={ t( r.k0 ) }
                    y={ -r.x1 }
                    width={ t( r.k1 + 1 - r.k0 ) }
                    height={ Math.max( 0.3, r.x1 - r.x0 ) }
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="3 3"
                    className="fill-none stroke-marigold stroke-1"
                />
            ) ) }
        </Fragment>
    );
}
