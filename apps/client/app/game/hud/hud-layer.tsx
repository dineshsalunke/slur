import type { ReactNode } from 'react';

export function HudLayer( { children }: { children: ReactNode } ) {
    return (
        <div className="pointer-events-none fixed inset-x-[clamp(16px,2.7vw,48px)] inset-y-[clamp(16px,4.4vh,46px)] z-20 font-readout text-readout uppercase select-none text-shadow-readout">
            { children }
        </div>
    );
}
