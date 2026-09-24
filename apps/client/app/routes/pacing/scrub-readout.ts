import { PACING_DZ, type PacingReport, SEG_LEN } from '@slur/shared';
import { forkLabel, forkVerdict } from './route-lines';

function signed( v: number ): string {
    return `${ v >= 0 ? '+' : '' }${ v.toFixed( 1 ) }`;
}

function activity( report: PacingReport, k: number ): string {
    const move = report.demand.moves.find( ( m ) => m.k0 <= k && k <= m.k1 );
    if ( move ) {
        if ( move.kind === 'jump' ) return 'input: jump';
        return `input: strafe ${ move.dir > 0 ? 'left' : 'right' }`;
    }
    const q = report.demand.quiet.find( ( s ) => s.k0 <= k && k < s.k1 );
    return q ? `quiet span ${ q.seconds.toFixed( 2 ) }s` : '';
}

function gapLine( report: PacingReport, i: number ): string | null {
    const g = report.gaps.find( ( x ) => x.i0 <= i && i <= x.i1 );
    if ( ! g ) return null;
    const win = ( w: typeof g.single ): string =>
        w ? `${ w.seconds.toFixed( 2 ) }s (${ signed( w.from ) }..${ signed( w.to ) }u of lip)` : 'none';
    return [
        `gap ${ g.forced ? 'FORCED' : 'optional' }${ g.jumped ? ', path jumps' : '' }${ g.rolls ? ', rolls over with no jump' : '' }${ g.slot ? ', lengthwise slot' : '' } · hole ${ g.holeLen }u at x ${ signed( g.x ) }`,
        `takeoff single ${ win( g.single ) } · double ${ win( g.double ) }`,
    ].join( '\n' );
}

function routeLine( report: PacingReport, k: number ): string | null {
    const { routes, arms } = report;
    if ( ! routes ) return null;
    const parts = [ `corridors ${ routes.corridors[ k ] }` ];
    const i =
        arms?.forks.findIndex( ( fa ) => routes.forks[ fa.fork ].k0 <= k && k <= routes.forks[ fa.fork ].k1 ) ?? -1;
    if ( arms && i >= 0 ) {
        const fa = arms.forks[ i ];
        parts.push( `${ forkLabel( i ) } ${ fa.arms.length } arms, ${ forkVerdict( fa ) }` );
        parts.push( `hard route x ${ signed( arms.hardest.path.x[ k ] ) }` );
    }
    return parts.join( ' · ' );
}

export function describeAt( report: PacingReport, seconds: number ): string {
    const { cruise, grid, path, demand, intent } = report;
    const z = Math.min( Math.max( 0, seconds * cruise ), report.finishZ - 1e-3 );
    const k = Math.min( grid.count - 1, Math.floor( z / PACING_DZ ) );
    const i = Math.floor( z / SEG_LEN );
    const section = intent?.sections.find( ( s ) => s.i0 <= i && i <= s.i1 )?.name ?? 'start';
    const band = intent?.bands[ i ];
    const lines = [
        `t ${ seconds.toFixed( 2 ) }s · z ${ z.toFixed( 0 ) }u · segment ${ i } · ${ section }`,
        `intensity ${ intent ? intent.intensity[ i ].toFixed( 2 ) : '–' }${ band ? ` · band x ${ signed( band.x0 ) }..${ signed( band.x1 ) }${ band.pinched ? ' PINCH' : '' }` : '' }`,
        `clearance ${ grid.widest[ k ].toFixed( 1 ) }u · path x ${ signed( path.x[ k ] ) } · strafe ${ demand.strafe[ k ].toFixed( 0 ) }u/s`,
        activity( report, k ),
    ];
    const route = routeLine( report, k );
    if ( route ) lines.push( route );
    const gap = gapLine( report, i );
    if ( gap ) lines.push( gap );
    return lines.join( '\n' );
}
