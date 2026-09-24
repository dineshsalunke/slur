import { REST_MIN_S, TRACK_CONTRACT } from '@slur/shared';
import { usePacingReport } from './pacing-report-context';
import { forkVerdict } from './route-lines';
import { Stat } from './stat';

export function BoardSummary() {
    const { demand, gaps, grid, jump, duration, routes, arms, score, adherence } = usePacingReport();
    const strafes = demand.moves.filter( ( m ) => m.kind === 'strafe' ).length;
    const jumps = demand.moves.filter( ( m ) => m.kind === 'jump' ).length;
    const reversals = demand.bins.reduce( ( s, b ) => s + b.reversals, 0 );
    const forced = gaps.filter( ( g ) => g.forced ).length;
    const quiet = demand.quiet.map( ( q ) => q.seconds );
    const quietTotal = quiet.reduce( ( s, v ) => s + v, 0 );
    const rests = quiet.filter( ( s ) => s >= REST_MIN_S ).length;
    let atClamp = 0;
    for ( const v of demand.strafe ) if ( v >= TRACK_CONTRACT.weaveStrafeClamp - 0.5 ) atClamp++;
    let narrowest = Number.POSITIVE_INFINITY;
    for ( const v of grid.widest ) if ( v > 0 && v < narrowest ) narrowest = v;
    return (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Stat label="duration" value={ `${ duration.toFixed( 1 ) }s` } />
            <Stat label="strafe moves" value={ String( strafes ) } />
            <Stat label="reversals" value={ String( reversals ) } />
            <Stat label="path jumps" value={ String( jumps ) } />
            <Stat label="notes · breaches" value={ `${ score.notes.length } · ${ score.breaches }` } />
            { adherence && (
                <Stat
                    label="band-line adherence"
                    value={ `${ ( 100 * adherence.share ).toFixed( 0 ) }% of ${ adherence.notes }` }
                />
            ) }
            <Stat label="gaps forced / all" value={ `${ forced } / ${ gaps.length }` } />
            <Stat label="quiet share" value={ `${ ( ( 100 * quietTotal ) / duration ).toFixed( 0 ) }%` } />
            <Stat label="longest quiet" value={ `${ Math.max( 0, ...quiet ).toFixed( 1 ) }s` } />
            <Stat label={ `rests ≥ ${ REST_MIN_S }s` } value={ String( rests ) } />
            <Stat label="at strafe cap" value={ `${ ( ( 100 * atClamp ) / demand.strafe.length ).toFixed( 1 ) }%` } />
            <Stat label="narrowest floor run" value={ `${ narrowest.toFixed( 1 ) }u` } />
            { arms && routes && (
                <Stat
                    label="forks real / all · dodges"
                    value={ `${ arms.forks.filter( ( fa ) => forkVerdict( fa ) === 'real' ).length } / ${ arms.forks.length } · ${ routes.forks.length - arms.forks.length }` }
                />
            ) }
            { arms && (
                <Stat
                    label="lateral easy / hard"
                    value={ `${ arms.easiest.lateral.toFixed( 0 ) } / ${ arms.hardest.lateral.toFixed( 0 ) }u` }
                />
            ) }
            <Stat
                label={ `air, ${ jump.source }` }
                value={ `${ jump.single.toFixed( 1 ) } / ${ jump.double.toFixed( 1 ) }u` }
            />
        </div>
    );
}
