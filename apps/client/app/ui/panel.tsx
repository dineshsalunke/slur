import type { ReactNode } from 'react';

export function Panel( { className = '', children }: { className?: string; children: ReactNode } ) {
    return (
        <div
            className={ `chamfer relative bg-glass-2 bg-[linear-gradient(135deg,var(--color-cyan)_0_11px,transparent_11px)] p-5 shadow-[inset_0_0_0_1px_var(--color-line)] backdrop-blur-[12px] ${ className }` }
        >
            { children }
        </div>
    );
}
