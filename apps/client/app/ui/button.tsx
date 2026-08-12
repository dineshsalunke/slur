import type { ReactNode } from 'react';

// The landing / console button (was `.btn` + `.btn-primary` / `.btn-ghost`): chamfered (cut-corner) mono caps.
// `primary` is the solid cyan CTA whose neon glow is a drop-shadow FILTER — a box-shadow would be clipped by
// the chamfer clip-path. `ghost` is a hairline outline. Border colour lives in the variant so primary's
// transparent edge and ghost's hairline never collide. Hover glow is gated `enabled:` (was `:not(:disabled)`).
//
// The glow is `drop-shadow-cta` (a --drop-shadow-* theme token), not an arbitrary `[filter:…]`: composing
// through Tailwind's own filter chain is what lets the disabled state layer grayscale/brightness on top.
// `.btn:disabled` used the `filter` SHORTHAND, which dropped the glow — `disabled:drop-shadow-none`
// reproduces that, because merely stacking grayscale would leave a desaturated glow behind.
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
