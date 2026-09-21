import { classOfShip, SHIP_CLASSES, type ShipClass, type ShipId, shipOf } from '@slur/shared';

const AXES = [
    { label: 'SPD', of: ( c: ShipClass ) => c.tuning.maxCruise, invert: false },
    { label: 'AGI', of: ( c: ShipClass ) => c.tuning.strafeAccel, invert: false },
    { label: 'ARM', of: ( c: ShipClass ) => c.armour, invert: false },
    { label: 'EVA', of: ( c: ShipClass ) => c.tuning.halfL, invert: true },
];

const BOUNDS = AXES.map( ( axis ) => {
    const values = Object.values( SHIP_CLASSES ).map( axis.of );
    return { min: Math.min( ...values ), max: Math.max( ...values ) };
} );

const MIN_FILL = 0.15;

function fillPercent( index: number, value: number ): number {
    const { min, max } = BOUNDS[ index ];
    if ( max === min ) return 100;
    const fraction = ( value - min ) / ( max - min );
    const ranked = AXES[ index ].invert ? 1 - fraction : fraction;
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
