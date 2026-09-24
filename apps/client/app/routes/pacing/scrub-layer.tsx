import { type PointerEvent, useRef } from 'react';
import { usePacingReport } from './pacing-report-context';
import { describeAt } from './scrub-readout';

export function ScrubLayer() {
    const report = usePacingReport();
    const lineRef = useRef< HTMLDivElement >( null );
    const readoutRef = useRef< HTMLPreElement >( null );

    const onMove = ( e: PointerEvent< HTMLDivElement > ): void => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const seconds = ( px / rect.width ) * report.duration;
        lineRef.current?.style.setProperty( '--scrub', String( px ) );
        lineRef.current?.style.setProperty( '--scrub-on', '1' );
        if ( readoutRef.current ) readoutRef.current.textContent = describeAt( report, seconds );
    };

    const onLeave = (): void => {
        lineRef.current?.style.setProperty( '--scrub-on', '0' );
    };

    return (
        <div
            className="absolute inset-y-0 left-44 z-20 w-[calc(var(--duration)*var(--pps)*1px)] cursor-crosshair"
            onPointerMove={ onMove }
            onPointerLeave={ onLeave }
        >
            <div
                ref={ lineRef }
                className="pointer-events-none absolute inset-y-0 left-0 w-px translate-x-[calc(var(--scrub,0)*1px)] bg-hud/70 opacity-[var(--scrub-on,0)]"
            />
            <pre
                ref={ readoutRef }
                className="pointer-events-none fixed right-4 bottom-4 z-30 min-w-96 rounded border border-line-2 bg-void/90 px-3 py-2 font-mono text-[11px] leading-relaxed whitespace-pre text-hud"
            >
                Move the pointer over the board to read it.
            </pre>
        </div>
    );
}
