import { classOfShip, SHIP_CLASSES, type ShipClass, type ShipId, shipOf } from '@slur/shared';

// One pickable ship in the lobby: display name, class, and its identity profile. Pure derivation from the
// shipId prop — NO subscription of its own (non-negotiable #10), so it re-renders only when the parent's
// existing lobby view changes.

// The axes the GDD actually argues about: agility ⊥ armour is the sidegrade, and length is the gap-tanking
// axis. Each reads straight from the class registry, so retuning a ship or adding one moves the bars with no
// second copy of the balance numbers living in the UI (ship stats are data — non-negotiable #6).
// EVERY bar reads "fuller = better". That is not cosmetic: a stat strip trains the eye that a full bar is a
// strength, so showing raw hull length would paint the Freighter's fat hit window as an asset — the exact
// opposite of what a picker is for. Hull length is therefore inverted into EVA (a short hull is a small
// target). Length does also help tank gaps; this card shows only its combat face, which is what you are
// choosing between here.
const AXES = [
    { label: 'SPD', of: ( c: ShipClass ) => c.tuning.maxCruise, invert: false },
    { label: 'AGI', of: ( c: ShipClass ) => c.tuning.strafeAccel, invert: false },
    { label: 'ARM', of: ( c: ShipClass ) => c.armour, invert: false },
    { label: 'EVA', of: ( c: ShipClass ) => c.tuning.halfL, invert: true },
];

// Normalise against the WHOLE roster so a bar reads "where this ship sits among the ships you can pick",
// not against an arbitrary absolute. Computed once at module scope from the registry.
const BOUNDS = AXES.map( ( axis ) => {
    const values = Object.values( SHIP_CLASSES ).map( axis.of );
    return { min: Math.min( ...values ), max: Math.max( ...values ) };
} );

// The roster-worst ship on an axis normalises to fraction 0 → an EMPTY bar, which reads as "zero stat /
// broken ship" rather than "slowest of the five" (the Executioner is 48 vs 70 top speed — slow, not stalled).
// So map the ranked fraction into [MIN_FILL, 1] instead of [0, 1]: the weakest reads low-but-present, the
// best stays full, and ordering is untouched (the map is monotonic). NOT zero-based normalisation — the speed
// range (48–70) is narrow, so anchoring at 0 would push every bar near-full and kill the visual spread.
const MIN_FILL = 0.15;

// A single-ship roster (or a flat axis) would divide by zero — fall back to a full bar rather than NaN.
function fillPercent( index: number, value: number ): number {
    const { min, max } = BOUNDS[ index ];
    if ( max === min ) return 100;
    const fraction = ( value - min ) / ( max - min );
    const ranked = AXES[ index ].invert ? 1 - fraction : fraction; // 0..1, fuller = better (post-invert)
    return Math.round( ( MIN_FILL + ranked * ( 1 - MIN_FILL ) ) * 100 );
}

export function ShipCard( {
    shipId,
    selected,
    disabled,
    onPick,
}: {
    shipId: ShipId;
    selected: boolean;
    disabled: boolean;
    onPick: () => void;
} ) {
    const ship = shipOf( shipId );
    const shipClass = classOfShip( shipId );

    // The three text nodes pin an explicit leading. Preflight's `button { font: inherit }` swaps the UA button
    // font (Arial) for the page stack (system-ui), and `line-height: normal` is FONT-METRIC dependent — so
    // every line box grew 1px (name 14→15, class 10→11, four stat rows 9→10) and the card with it, 94→100px.
    // Pinning the leading makes the card height independent of which font resolves, which is what a
    // fixed-size HUD chip wants anyway.
    return (
        <button
            type="button"
            disabled={ disabled }
            className={ `flex min-w-[106px] cursor-pointer flex-col gap-[3px] rounded-[4px] border px-[9px] py-[7px] text-left text-hud disabled:cursor-default disabled:opacity-50 ${ selected ? 'border-cyan bg-cyan/[0.22] shadow-ship-on' : 'border-cyan/40 bg-cyan/[0.06]' }` }
            aria-pressed={ selected }
            aria-label={ `${ ship.name }, ${ shipClass.name } class` }
            onClick={ onPick }
        >
            <span className="text-[12px] leading-[14px] uppercase tracking-[1.5px] text-cyan">{ ship.name }</span>
            <span className="text-[9px] leading-[10px] uppercase tracking-[1px] opacity-65">{ shipClass.name }</span>
            <span className="mt-[3px] flex flex-col gap-[3px]">
                { AXES.map( ( axis, i ) => (
                    <span className="flex items-center gap-[5px]" key={ axis.label }>
                        <span className="w-6 text-[8px] leading-[9px] tracking-[0.5px] opacity-55">{ axis.label }</span>
                        <span className="h-[3px] flex-1 overflow-hidden rounded-[2px] bg-cyan/[0.14]">
                            <span
                                className="block h-full bg-marigold shadow-stat"
                                style={ { width: `${ fillPercent( i, axis.of( shipClass ) ) }%` } }
                            />
                        </span>
                    </span>
                ) ) }
            </span>
        </button>
    );
}
