export interface Hint {
    keys: readonly string[];
    does: string;
}

export function KeyHint( { hints, className = '' }: { hints: readonly Hint[]; className?: string } ) {
    return (
        <dl className={ `items-center gap-5 text-[12px] uppercase tracking-[0.16em] text-readout-dim ${ className }` }>
            { hints.map( ( h ) => (
                <div key={ h.does } className="flex items-center gap-1.5">
                    <dt className="flex gap-1">
                        { h.keys.map( ( k ) => (
                            <kbd
                                key={ k }
                                className="grid h-6 min-w-6 place-items-center border border-readout/25 px-1.5 font-readout text-[11px] font-semibold tracking-[0.06em] text-readout"
                            >
                                { k }
                            </kbd>
                        ) ) }
                    </dt>
                    <dd className="m-0">{ h.does }</dd>
                </div>
            ) ) }
        </dl>
    );
}
