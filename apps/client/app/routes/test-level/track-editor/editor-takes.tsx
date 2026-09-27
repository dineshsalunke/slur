import { FIXED_DT } from '@slur/shared';
import { clearTakes } from '../flight-recorder/flight-recorder.state';
import { clockOf, countOf } from '../flight-recorder/flight-recorder.utils';
import { useRecorder } from '../flight-recorder/use-recorder';
import { TAKE_ROW_CLASSES, TRACE_LEGEND } from './track-editor.constants';

export function EditorTakes() {
    const takes = useRecorder( ( v ) => v.takes );
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-dim">Flight takes</h2>
            { takes.length === 0 ? (
                <p className="text-[12px] leading-relaxed text-dim">
                    Press T in the game to start and stop a recording. The last three takes show on the map.
                </p>
            ) : (
                <ol className="flex flex-col gap-1 font-mono text-[12px]">
                    { takes.map( ( t, i ) => (
                        <li key={ t.id } className={ `${ TAKE_ROW_CLASSES[ i ] } flex justify-between gap-2` }>
                            <span>
                                #{ t.id } · { clockOf( Math.round( t.ticks * FIXED_DT ) ) }
                            </span>
                            <span>
                                { countOf( t, 'death' ) } deaths · { countOf( t, 'bump' ) } bumps
                            </span>
                        </li>
                    ) ) }
                </ol>
            ) }
            <div className="h-1.5 bg-linear-to-r from-dim via-cyan to-marigold" />
            <p className="flex justify-between text-[11px] text-dim">
                <span>Slow</span>
                <span>Cruise</span>
                <span className="text-hud">White = boost</span>
            </p>
            <ul className="grid grid-cols-3 gap-1 text-[11px] text-dim">
                { TRACE_LEGEND.map( ( m ) => (
                    <li key={ m.label }>
                        <span className={ m.className }>{ m.glyph }</span> { m.label }
                    </li>
                ) ) }
            </ul>
            { takes.length > 0 ? (
                <button
                    type="button"
                    onClick={ clearTakes }
                    className="cursor-pointer border border-line-2 px-3 py-2 text-[13px] uppercase tracking-[0.2em] text-hud hover:border-marigold"
                >
                    Clear takes
                </button>
            ) : null }
        </section>
    );
}
