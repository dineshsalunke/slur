import { BOUNDARY_VARIANT, type BoundaryVariant } from '../game/scene/track-geometry';
import { setBoundaryVariant } from './debug-tuning';

const BTN = 'flex-1 rounded border px-2 py-1 font-mono text-[11px] transition-colors hover:bg-white/10';
const ON = 'border-amber-400/60 bg-amber-400/15 text-amber-200';
const OFF = 'border-white/15 text-white/60';

/** What each variant does to the deck, in the few words that fit under four buttons. */
const BLURB: Record< BoundaryVariant, string > = {
    A: 'inboard bevel — eats width per side (shipped)',
    B: 'outboard flare — takes no deck; hidden across the track unless wrap < 0.117 × width',
    C: 'inboard, marigold ramped inward — no hard inner line',
    D: 'outboard rail — band in [32, 32+width], deck keeps ±32; wrap raises it, 0 = flush',
};

/**
 * The boundary gate. Buttons rather than a slider: each click rebuilds both track geometries
 * (~8.6 ms over 400 segments), which a drag would do on every pointermove.
 */
export function DebugVariant( { value }: { value: BoundaryVariant } ) {
    const options: BoundaryVariant[] = [ 'A', 'B', 'C', 'D' ];

    return (
        <div className="mb-1">
            <div className="mb-1 flex gap-1">
                { options.map( ( v ) => (
                    <button
                        key={ v }
                        type="button"
                        className={ `${ BTN } ${ v === value ? ON : OFF }` }
                        onClick={ () => setBoundaryVariant( v ) }
                    >
                        { v }
                        { v === BOUNDARY_VARIANT ? '*' : '' }
                    </button>
                ) ) }
            </div>
            <div className="text-[10px] leading-relaxed text-white/45">{ BLURB[ value ] }</div>
        </div>
    );
}
