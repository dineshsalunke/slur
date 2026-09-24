import type { LabView } from './lab-view';

export function VariantInfo( { view }: { view: LabView } ) {
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-dim">mapping rules</h2>
            <ul className="list-inside list-disc">
                { view.rules.map( ( r ) => (
                    <li key={ r }>{ r }</li>
                ) ) }
            </ul>
            <h2 className="text-dim">score</h2>
            <p className="break-all">{ view.score }</p>
        </section>
    );
}
