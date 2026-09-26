import { ForkArmRow } from '../fork-arm-row/fork-arm-row';
import { usePacingReport } from '../pacing-report-context';
import { forkVerdict } from '../route-lines';
import { HEAD } from './fork-table.constants';
import { armRows } from './fork-table.utils';

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
