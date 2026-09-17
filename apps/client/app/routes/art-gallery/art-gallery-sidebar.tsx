import { FIGHTER_L, FIGHTER_W, SUBJECTS } from './subjects';

const BTN = 'rounded border border-white/15 px-2 py-1 font-mono text-[11px] transition-colors hover:bg-white/10';
const BTN_ON = 'border-amber-400/60 bg-amber-400/15 text-amber-200';
const BTN_OFF = 'text-white/60';

function dimsLabel( dims: readonly number[] | null ): string {
    if ( ! dims ) return '—';
    return `${ dims[ 0 ] } × ${ dims[ 1 ] } × ${ dims[ 2 ] }u`;
}

/**
 * DOM chrome for the gallery: the subject manifest with REAL dimensions printed next to each entry, plus
 * the post-processing toggles.
 *
 * Printing dimensions is not decoration. Every scale error in `art-handoff-v1` survived because objects
 * were judged by eye without a number attached; this panel makes the number impossible to miss.
 */
export function ArtGallerySidebar( {
    bloom,
    onBloom,
    showGrid,
    onShowGrid,
}: {
    bloom: boolean;
    onBloom: ( on: boolean ) => void;
    showGrid: boolean;
    onShowGrid: ( on: boolean ) => void;
} ) {
    return (
        <div className="pointer-events-auto fixed top-4 left-4 z-10 max-h-[calc(100vh-2rem)] w-80 overflow-y-auto rounded-lg border border-white/10 bg-black/80 p-3 font-mono text-[11px] text-white/80 backdrop-blur">
            <div className="mb-1 text-[12px] font-semibold tracking-wide text-amber-300">SLUR · ART GALLERY</div>
            <div className="mb-3 text-[10px] leading-relaxed text-white/40">
                Every subject at TRUE scale, under the game's own bloom. The cyan rectangle on each deck is the
                Fighter's real footprint ({ FIGHTER_W.toFixed( 2 ) } × { FIGHTER_L.toFixed( 2 ) }u) — your scale
                reference. Drag to orbit, scroll to zoom.
            </div>

            <div className="mb-3 flex gap-1">
                <button
                    type="button"
                    className={ `${ BTN } ${ bloom ? BTN_ON : BTN_OFF }` }
                    onClick={ () => onBloom( ! bloom ) }
                >
                    bloom
                </button>
                <button
                    type="button"
                    className={ `${ BTN } ${ showGrid ? BTN_ON : BTN_OFF }` }
                    onClick={ () => onShowGrid( ! showGrid ) }
                >
                    grid
                </button>
            </div>

            <ol className="flex flex-col gap-3">
                { SUBJECTS.map( ( s, i ) => (
                    <li key={ s.id } className="border-white/10 border-t pt-2">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-white/90">
                                { i + 1 }. { s.name }
                            </span>
                            <span className="shrink-0 text-amber-300/80">{ dimsLabel( s.dims ) }</span>
                        </div>
                        <div className="mt-1 text-[10px] leading-relaxed text-white/45">{ s.note }</div>
                    </li>
                ) ) }
            </ol>
        </div>
    );
}
