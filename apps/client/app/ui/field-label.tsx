import type { ReactNode } from 'react';

export const LABEL =
    'items-baseline justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-readout-dim';

export function FieldLabel( { htmlFor, children }: { htmlFor: string; children: ReactNode } ) {
    return (
        <label htmlFor={ htmlFor } className={ `flex ${ LABEL }` }>
            { children }
        </label>
    );
}
