import type { ReactNode } from 'react';
import { LABEL } from './field-label.constants';

export function FieldLabel( { htmlFor, children }: { htmlFor: string; children: ReactNode } ) {
    return (
        <label htmlFor={ htmlFor } className={ `flex ${ LABEL }` }>
            { children }
        </label>
    );
}
