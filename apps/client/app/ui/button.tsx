import type { ReactNode } from 'react';

const VARIANT = {
    primary: 'h-11 border-transparent bg-cyan text-ink drop-shadow-cta enabled:hover:drop-shadow-cta-hover',
    ghost: 'h-9 border-line-2 text-fg enabled:hover:border-marigold enabled:hover:text-white',
} as const;

export function Button( {
    variant,
    disabled = false,
    onClick,
    children,
}: {
    variant: keyof typeof VARIANT;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
} ) {
    return (
        <button
            type="button"
            disabled={ disabled }
            onClick={ onClick }
            className={ `chamfer-btn cursor-pointer whitespace-nowrap border px-[22px] font-mono text-[12px] font-bold uppercase tracking-[0.16em] transition active:translate-y-px disabled:cursor-not-allowed disabled:grayscale-[50%] disabled:brightness-[0.7] disabled:drop-shadow-none ${ VARIANT[ variant ] }` }
        >
            { children }
        </button>
    );
}
