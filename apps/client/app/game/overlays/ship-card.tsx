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

// A single-ship roster (or a flat axis) would divide by zero — fall back to a full bar rather than NaN.
function fillPercent( index: number, value: number ): number {
    const { min, max } = BOUNDS[ index ];
    if ( max === min ) return 100;
    const fraction = ( value - min ) / ( max - min );
    return Math.round( ( AXES[ index ].invert ? 1 - fraction : fraction ) * 100 );
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

    return (
        <button
            type="button"
            disabled={ disabled }
            className={ selected ? 'slur-shipcard slur-on' : 'slur-shipcard' }
            aria-pressed={ selected }
            aria-label={ `${ ship.name }, ${ shipClass.name } class` }
            onClick={ onPick }
        >
            <span className="slur-shipcard-name">{ ship.name }</span>
            <span className="slur-shipcard-class">{ shipClass.name }</span>
            <span className="slur-statlist">
                { AXES.map( ( axis, i ) => (
                    <span className="slur-stat" key={ axis.label }>
                        <span className="slur-stat-label">{ axis.label }</span>
                        <span className="slur-stat-track">
                            <span
                                className="slur-stat-fill"
                                style={ { width: `${ fillPercent( i, axis.of( shipClass ) ) }%` } }
                            />
                        </span>
                    </span>
                ) ) }
            </span>
        </button>
    );
}
