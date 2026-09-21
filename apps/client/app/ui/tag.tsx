import type { ReactNode } from 'react';

const VARIANT = {
    default: 'border-hud/35',
    host: 'border-cyan text-cyan',
    spec: 'border-magenta text-magenta',
    fin: 'border-fin text-fin',
} as const;

export function Tag( { variant = 'default', children }: { variant?: keyof typeof VARIANT; children: ReactNode } ) {
    return (
        <span
            className={ `rounded-[3px] border px-[5px] py-px text-[9px] uppercase tracking-[1px] opacity-[0.85] ${ VARIANT[ variant ] }` }
        >
            { children }
        </span>
    );
}
