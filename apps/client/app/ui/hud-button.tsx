import type { ReactNode } from 'react';

// The in-game HUD button (was `.slur-btn` + `.slur-go` / `.slur-leave`). `go` is the cyan primary action (GO,
// Play Again, Leave-the-race confirm) with a glow + disabled state; `leave` is the magenta exit accent. Colour
// + bg live in the variant (not the base) so the two never collide as competing utilities.
const VARIANT = {
    go: 'border-cyan bg-cyan/12 font-bold shadow-go disabled:cursor-default disabled:opacity-40 disabled:shadow-none',
    leave: 'border-magenta bg-magenta/12',
} as const;

export function HudButton( {
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
            className={ `cursor-pointer rounded-[5px] border px-4 py-2 text-[13px] uppercase tracking-[2px] text-hud ${ VARIANT[ variant ] }` }
        >
            { children }
        </button>
    );
}
