import type { ReactNode } from 'react';

// The landing / console button (was `.btn` + `.btn-primary` / `.btn-ghost`): chamfered (cut-corner) mono caps.
// `primary` is the solid cyan CTA whose neon glow is a drop-shadow FILTER — a box-shadow would be clipped by
// the chamfer clip-path. `ghost` is a hairline outline. Border colour lives in the variant so primary's
// transparent edge and ghost's hairline never collide. Hover glow is gated `enabled:` (was `:not(:disabled)`).
const VARIANT = {
    primary:
        'h-11 border-transparent bg-cyan text-[#04222a] [filter:drop-shadow(0_0_14px_rgba(0,229,255,0.5))] enabled:hover:[filter:drop-shadow(0_0_20px_rgba(0,229,255,0.78))]',
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
            className={ `chamfer-btn cursor-pointer whitespace-nowrap border px-[22px] font-mono text-[12px] font-bold uppercase tracking-[0.16em] transition active:translate-y-px disabled:cursor-not-allowed disabled:[filter:grayscale(0.5)_brightness(0.7)] ${ VARIANT[ variant ] }` }
        >
            { children }
        </button>
    );
}
