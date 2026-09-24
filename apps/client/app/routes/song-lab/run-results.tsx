import { Link } from 'react-router';
import { formatShort, type LabRow, type LabView, labHref } from './lab-view';
import { ReplayVerdict } from './replay-verdict';

function verdict( row: LabRow ): string {
    if ( row.match === null ) return '—';
    return row.match ? 'MATCH' : 'DIVERGED';
}

function rowClass( row: LabRow, view: LabView ): string {
    if ( row.key === view.key ) return 'text-marigold';
    return row.match === false ? 'text-threat' : 'hover:text-marigold';
}

export function RunResults( { view }: { view: LabView } ) {
    const matched = view.results.filter( ( r ) => r.match ).length;
    return (
        <section className="flex flex-col gap-1">
            <h2 className="text-dim">recorded runs · headless replay</h2>
            <p className={ view.digestOk && matched === view.results.length ? 'text-dim' : 'text-threat' }>
                track digest { view.digestOk ? 'MATCH' : 'DIVERGED' } · { matched } / { view.results.length } runs MATCH
            </p>
            { view.results.map( ( row ) => (
                <Link
                    key={ row.key }
                    className={ `grid grid-cols-[11ch_7ch_8ch_1fr] gap-x-2 whitespace-nowrap text-xs ${ rowClass( row, view ) }` }
                    to={ labHref( {
                        bundle: view.bundle,
                        variant: view.variant,
                        classId: row.classId,
                        pilot: row.pilot,
                    } ) }
                >
                    <span>{ row.classId }</span>
                    <span>{ row.pilot }</span>
                    <span>{ verdict( row ) }</span>
                    <span>{ formatShort( row.result ) }</span>
                </Link>
            ) ) }
            <ReplayVerdict recorded={ view.results.find( ( r ) => r.key === view.key )?.result ?? null } />
        </section>
    );
}
