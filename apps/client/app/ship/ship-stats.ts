import { SHIP_CLASSES, type ShipClass } from '@slur/shared';

export const STAT_AXES = [
    { label: 'SPD', name: 'Speed', of: ( c: ShipClass ) => c.tuning.maxCruise, invert: false },
    { label: 'AGI', name: 'Agility', of: ( c: ShipClass ) => c.tuning.strafeAccel, invert: false },
    { label: 'ARM', name: 'Armour', of: ( c: ShipClass ) => c.armour, invert: false },
    { label: 'EVA', name: 'Evasion', of: ( c: ShipClass ) => c.tuning.halfL, invert: true },
] as const;

const BOUNDS = STAT_AXES.map( ( axis ) => {
    const values = Object.values( SHIP_CLASSES ).map( axis.of );
    return { min: Math.min( ...values ), max: Math.max( ...values ) };
} );

const MIN_FILL = 0.15;

export function statFill( index: number, shipClass: ShipClass ): number {
    const axis = STAT_AXES[ index ];
    const { min, max } = BOUNDS[ index ];
    if ( max === min ) return 100;
    const fraction = ( axis.of( shipClass ) - min ) / ( max - min );
    const ranked = axis.invert ? 1 - fraction : fraction;
    return Math.round( ( MIN_FILL + ranked * ( 1 - MIN_FILL ) ) * 100 );
}
