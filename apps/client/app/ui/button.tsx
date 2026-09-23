import type { ReactNode } from 'react';

export function Button( {
    name,
    value,
    disabled = false,
    className = '',
    children,
}: {
    name?: string;
    value?: string;
    disabled?: boolean;
    className?: string;
    children: ReactNode;
} ) {
    return (
        <button
            type="submit"
            name={ name }
            value={ value }
            disabled={ disabled }
            className={ `inline-flex h-11 cursor-pointer items-center justify-center gap-3 whitespace-nowrap bg-marigold px-7 text-[14px] font-bold uppercase tracking-[0.2em] text-deep transition-[background-color,box-shadow,translate] duration-150 ease-out enabled:hover:shadow-cta enabled:active:translate-y-px enabled:active:bg-core focus-visible:bg-core focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core disabled:cursor-wait disabled:opacity-70 ${ className }` }
        >
            { children }
        </button>
    );
}
