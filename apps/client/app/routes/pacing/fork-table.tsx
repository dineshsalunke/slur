import { PACING_DZ, type PacingReport } from '@slur/shared';
import { type ArmRowData, ForkArmRow } from './fork-arm-row';
import { usePacingReport } from './pacing-report-context';
import { forkLabel, forkVerdict } from './route-lines';

const HEAD = [
    'fork',
    'split',
    'length',
    'sep',
    'verdict',
    'arm',
    'lateral u',
    'rev',
    'peak u/s',
    'jumps',
    'air u',
    'gaps',
    'stuck',
    '',
];

function armRows( report: PacingReport ): ArmRowData[] {
    const { arms, routes, cruise } = report;
    if ( ! arms || ! routes ) return [];
    return arms.forks.flatMap( ( fa, i ) => {
        const f = routes.forks[ fa.fork ];
        const z = f.k0 * PACING_DZ;
        return fa.arms.map( ( a, j ) => ( {
            fork: i,
            arm: j,
            armCount: fa.arms.length,
            label: forkLabel( i ),
            z,
            seconds: z / cruise,
            length: f.length,
            separation: f.separation,
            verdict: forkVerdict( fa ),
            air: f.arms[ j ].air,
            lateral: a.lateral,
            reversals: a.reversals,
            peakStrafe: a.peakStrafe,
            jumps: a.jumps,
            airU: a.air,
            gaps: a.gaps.length,
            stuck: a.stuck,
            barred: a.barred,
            tags: [
                j === fa.easiest ? 'easiest' : '',
                j === fa.hardest ? 'hardest' : '',
                a.dominated ? 'dominated' : '',
                arms.easiest.choice[ i ] === j ? 'on easy route' : '',
                arms.hardest.choice[ i ] === j ? 'on hard route' : '',
            ]
                .filter( Boolean )
                .join( ' · ' ),
        } ) );
    } );
}

export function ForkTable() {
    const report = usePacingReport();
    const rows = armRows( report );
    if ( ! report.arms ) return null;
    const real = report.arms.forks.filter( ( fa ) => forkVerdict( fa ) === 'real' ).length;
    return (
        <section className="sticky left-0 max-w-full px-4 py-3 text-[11px] text-fg">
            <h2 className="mb-2 font-display text-xs tracking-[0.2em] text-marigold uppercase">
                Forks — { real } real / { report.arms.forks.length }
            </h2>
            <p className="mb-2 text-dim">
                Click an arm to draw it on the strip and the strafe plot. Click it again to clear.
            </p>
            <table className="border-collapse font-mono">
                <thead className="text-dim">
                    <tr>
                        { HEAD.map( ( h ) => (
                            <th key={ h } className="px-2 py-1 text-left font-normal">
                                { h }
                            </th>
                        ) ) }
                    </tr>
                </thead>
                <tbody>
                    { rows.map( ( row ) => (
                        <ForkArmRow key={ `${ row.fork }:${ row.arm }` } row={ row } />
                    ) ) }
                </tbody>
            </table>
        </section>
    );
}
