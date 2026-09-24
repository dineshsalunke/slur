import { FIXED_DT } from '@slur/shared';
import { formatResult, type LabView } from './lab-view';
import { ReplayVerdict } from './replay-verdict';

export function RunResults( { view }: { view: LabView } ) {
    return (
        <section className="flex flex-col gap-1">
            <h2 className="text-dim">recorded runs</h2>
            { view.results.map( ( { shipId, result } ) => (
                <div key={ shipId } className={ shipId === view.shipId ? 'text-marigold' : '' }>
                    <span className="inline-block w-28">{ shipId }</span>
                    { formatResult( result, FIXED_DT ) }
                </div>
            ) ) }
            <ReplayVerdict recorded={ view.results.find( ( r ) => r.shipId === view.shipId )?.result ?? null } />
        </section>
    );
}
