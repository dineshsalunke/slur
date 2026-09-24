import type { ReactNode } from 'react';

export function Pin( { x, className, children }: { x: number; className: string; children: ReactNode } ) {
    const place = ( el: HTMLSpanElement | null ) => {
        el?.style.setProperty( '--x', `${ x * 100 }%` );
    };
    return (
        <span ref={ place } className={ `absolute left-[var(--x)] ${ className }` }>
            { children }
        </span>
    );
}
