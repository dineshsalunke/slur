import type { ReactNode } from 'react';

interface MetricPanelProps {
    label: string;
    unit?: string;
    legend?: ReactNode;
    heightClass: string;
    duration: number;
    yMin: number;
    yMax: number;
    children: ReactNode;
}

export function MetricPanel( { label, unit, legend, heightClass, duration, yMin, yMax, children }: MetricPanelProps ) {
    return (
        <div className="flex border-b border-line">
            <div className="sticky left-0 z-10 flex w-44 shrink-0 flex-col gap-1 border-r border-line bg-void px-3 py-2 text-[11px] text-dim">
                <div className="text-xs text-fg">{ label }</div>
                { unit && <div>{ unit }</div> }
                { legend }
            </div>
            <svg
                viewBox={ `0 ${ -yMax } ${ duration } ${ yMax - yMin }` }
                preserveAspectRatio="none"
                className={ `block w-[calc(var(--duration)*var(--pps)*1px)] shrink-0 ${ heightClass }` }
                role="img"
                aria-label={ label }
            >
                { children }
            </svg>
        </div>
    );
}
