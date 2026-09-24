import { SEG_LEN } from '@slur/shared';
import { setTimeVar, TICK_EVERY_S } from './board-scale';
import { usePacingReport } from './pacing-report-context';

export function TimeRuler() {
    const { duration, cruise, intent } = usePacingReport();
    if ( ! intent ) return null;
    const { sections } = intent;
    const ticks: number[] = [];
    for ( let s = 0; s <= duration; s += TICK_EVERY_S ) ticks.push( s );
    const segT = SEG_LEN / cruise;
    return (
        <div className="flex border-b border-line">
            <div className="sticky left-0 z-10 w-44 shrink-0 border-r border-line bg-void px-3 py-1 text-[11px] text-dim">
                time · section
            </div>
            <div className="relative h-10 w-[calc(var(--duration)*var(--pps)*1px)] shrink-0 text-[10px]">
                { ticks.map( ( s ) => (
                    <span
                        key={ s }
                        ref={ ( el ) => setTimeVar( el, '--at', s ) }
                        className="absolute top-0 left-[calc(var(--at)*var(--pps)*1px)] border-l border-line-2 pl-1 text-dim"
                    >
                        { s }s
                    </span>
                ) ) }
                { sections.map( ( sec ) => (
                    <span
                        key={ sec.name }
                        ref={ ( el ) => setTimeVar( el, '--at', sec.i0 * segT ) }
                        className="absolute bottom-0.5 left-[calc(var(--at)*var(--pps)*1px)] border-l border-marigold/60 pl-1 text-fg"
                    >
                        { sec.name }
                    </span>
                ) ) }
            </div>
        </div>
    );
}
