import type { LabView } from './lab-view';

export function VariantInfo( { view }: { view: LabView } ) {
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-marigold">{ view.label }</h2>
            <h2 className="text-dim">mapping rules</h2>
            <ul className="flex flex-col gap-1">
                { view.rules.map( ( r ) => (
                    <li key={ `${ r.from }→${ r.to }` }>
                        <span className="text-fg">{ r.from }</span>
                        <span className="text-dim"> → </span>
                        <span className="text-fg">{ r.to }</span>
                        <p className="text-dim">{ r.detail }</p>
                    </li>
                ) ) }
            </ul>
            <h2 className="text-dim">score</h2>
            <p className="break-all">{ view.scoreString }</p>
            <h2 className="text-dim">phrases</h2>
            <ol className="list-inside list-decimal">
                { view.phraseStrings.map( ( p, i ) => (
                    <li key={ `${ i }:${ p }` } className="break-all">
                        { p }
                    </li>
                ) ) }
            </ol>
        </section>
    );
}
