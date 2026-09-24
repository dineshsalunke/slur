import { formatResult, type LabRow, type LabView } from './lab-view';
import { ReplayVerdict } from './replay-verdict';

function verdict( row: LabRow ): string {
    if ( row.match === null ) return '—';
    return row.match ? 'MATCH' : 'DIVERGED';
}

export function RunResults( { view }: { view: LabView } ) {
    return (
        <section className="flex flex-col gap-1">
            <h2 className="text-dim">recorded runs · headless replay</h2>
            <p className={ view.digestOk ? 'text-dim' : 'text-threat' }>
                track digest { view.digestOk ? 'MATCH' : 'DIVERGED' }
            </p>
            { view.results.map( ( row ) => (
                <div key={ row.classId } className={ row.classId === view.classId ? 'text-marigold' : '' }>
                    <span className="inline-block w-24">{ row.classId }</span>
                    <span className={ `inline-block w-20 ${ row.match === false ? 'text-threat' : '' }` }>
                        { verdict( row ) }
                    </span>
                    { formatResult( row.result ) }
                </div>
            ) ) }
            <ReplayVerdict recorded={ view.results.find( ( r ) => r.classId === view.classId )?.result ?? null } />
        </section>
    );
}
