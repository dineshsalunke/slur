import type { ReactNode } from 'react';
import { VARIANT } from './hud-button.constants';

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
