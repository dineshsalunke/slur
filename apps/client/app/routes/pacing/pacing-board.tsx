import { useRef } from 'react';
import { DEFAULT_PPS } from './board-scale';
import { BoardSummary } from './board-summary';
import { ClearancePlot } from './clearance-plot';
import { GapPlot } from './gap-plot';
import { IntensityPlot } from './intensity-plot';
import { LateralBars } from './lateral-bars';
import { usePacingReport } from './pacing-report-context';
import { PacingStrip } from './pacing-strip';
import { QuietPlot } from './quiet-plot';
import { ScrubLayer } from './scrub-layer';
import { SeedForm } from './seed-form';
import { StrafePlot } from './strafe-plot';
import { TimeRuler } from './time-ruler';
import { ZoomControls } from './zoom-controls';

function initScale( el: HTMLElement | null, duration: number ): void {
    if ( ! el ) return;
    el.style.setProperty( '--duration', String( duration ) );
    if ( el.dataset.pps === undefined ) {
        el.dataset.pps = String( DEFAULT_PPS );
        el.style.setProperty( '--pps', String( DEFAULT_PPS ) );
    }
}

export function PacingBoard( { seed }: { seed: number } ) {
    const rootRef = useRef< HTMLElement | null >( null );
    const scrollerRef = useRef< HTMLDivElement >( null );
    const { duration, cruise } = usePacingReport();
    return (
        <main
            ref={ ( el ) => {
                rootRef.current = el;
                initScale( el, duration );
            } }
            className="flex h-screen flex-col bg-void text-fg"
        >
            <header className="flex shrink-0 flex-col gap-3 border-b border-line-2 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <h1 className="font-display text-sm tracking-[0.2em] text-marigold uppercase">Pacing board</h1>
                    <SeedForm seed={ seed } />
                    <ZoomControls rootRef={ rootRef } scrollerRef={ scrollerRef } duration={ duration } />
                    <span className="text-[11px] text-dim">time = z / pacingCruise { cruise }u/s</span>
                </div>
                <BoardSummary />
            </header>
            <div ref={ scrollerRef } className="relative min-h-0 flex-1 overflow-auto pb-40">
                <div className="relative w-max">
                    <TimeRuler />
                    <IntensityPlot />
                    <PacingStrip />
                    <ClearancePlot />
                    <StrafePlot />
                    <LateralBars />
                    <QuietPlot />
                    <GapPlot />
                    <ScrubLayer />
                </div>
            </div>
        </main>
    );
}
