import { Link } from 'react-router';
import { type LabPick, type LabView, labHref } from './lab-view';

const CHIP = 'border px-2 py-0.5';
const ON = `${ CHIP } border-marigold text-marigold`;
const OFF = `${ CHIP } border-line-2 text-dim hover:text-fg`;

export function LabPicker( { view }: { view: LabView } ) {
    const pick: LabPick = { bundle: view.bundle, variant: view.variant, classId: view.classId, pilot: view.pilot };
    const rows = [
        { label: 'bundle', items: view.bundles, current: view.bundle, to: ( b: string ) => ( { ...pick, bundle: b } ) },
        {
            label: 'variant',
            items: view.variants,
            current: view.variant,
            to: ( v: string ) => ( { ...pick, variant: v } ),
        },
        {
            label: 'class',
            items: view.classes,
            current: view.classId,
            to: ( c: string ) => ( { ...pick, classId: c as LabPick[ 'classId' ] } ),
        },
        {
            label: 'pilot',
            items: view.pilots,
            current: view.pilot,
            to: ( p: string ) => ( { ...pick, pilot: p as LabPick[ 'pilot' ] } ),
        },
    ];
    return (
        <section className="flex flex-col gap-2">
            { rows.map( ( row ) => (
                <div key={ row.label } className="flex flex-wrap items-center gap-1">
                    <span className="w-16 text-dim">{ row.label }</span>
                    { row.items.map( ( item ) => (
                        <Link
                            key={ item }
                            className={ item === row.current ? ON : OFF }
                            to={ labHref( row.to( item ) ) }
                        >
                            { item }
                        </Link>
                    ) ) }
                </div>
            ) ) }
            <p className="text-dim">
                song { view.song } · ship { view.shipId }
            </p>
        </section>
    );
}
