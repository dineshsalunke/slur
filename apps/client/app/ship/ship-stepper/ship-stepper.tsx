import { SHIP_CLASSES, SHIPS } from '@slur/shared';
import { Chevron } from '../../ui/chevron';
import { LABEL } from '../../ui/field-label/field-label.constants';
import { useShipChoice } from '../ship-choice';
import { STEP } from './ship-stepper.constants';

export function ShipStepper( {
    onStep,
    disabled = false,
    classLegend = '',
}: {
    onStep: ( dir: -1 | 1 ) => void;
    disabled?: boolean;
    classLegend?: string;
} ) {
    const ship = useShipChoice();
    const hull = SHIPS[ ship.id ];

    return (
        <fieldset disabled={ disabled } className="m-0 min-w-0 border-0 p-0 disabled:opacity-60">
            <legend className={ `float-left mb-1.5 w-full ${ LABEL } flex` }>
                <span>Ship</span>
                <span className={ `font-normal tracking-[0.16em] ${ classLegend }` }>
                    Class · { SHIP_CLASSES[ hull.classId ].name }
                </span>
            </legend>
            <div className="clear-left flex items-stretch border border-readout/20 bg-deep">
                <button type="button" aria-label="Previous ship" className={ STEP } onClick={ () => onStep( -1 ) }>
                    <Chevron dir="left" />
                </button>
                <output
                    aria-live="polite"
                    className="relative grid min-w-[12ch] flex-1 place-items-center px-2 text-[16px] font-semibold uppercase tracking-[0.14em] text-readout"
                >
                    { hull.name }
                    <span
                        key={ ship.turn }
                        className={ `edge-sweep absolute inset-x-3 bottom-1.5 h-px bg-marigold ${ ship.dir < 0 ? 'origin-right' : 'origin-left' }` }
                    />
                </output>
                <button type="button" aria-label="Next ship" className={ STEP } onClick={ () => onStep( 1 ) }>
                    <Chevron dir="right" />
                </button>
            </div>
        </fieldset>
    );
}
