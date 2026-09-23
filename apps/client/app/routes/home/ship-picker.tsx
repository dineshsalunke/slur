import { SHIP_CLASSES, SHIPS } from '@slur/shared';
import { useEffect } from 'react';
import { Chevron } from './chevron';
import { LABEL } from './field-label';
import { MENU_FORM } from './menu-form';
import { cycleShip, useShipChoice } from './ship-choice';

const KEY_DIR: Record< string, -1 | 1 > = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 };

const STEP =
    'grid h-11 w-10 flex-none cursor-pointer place-items-center text-readout-dim transition-colors duration-150 hover:text-readout focus-visible:text-readout focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-readout';

function typing( target: EventTarget | null ): boolean {
    return (
        target instanceof HTMLElement &&
        ( target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test( target.tagName ) )
    );
}

export function ShipPicker() {
    const ship = useShipChoice();
    const hull = SHIPS[ ship.id ];

    // Syncs with the browser keyboard: A/D and the arrow keys cycle the ship, and Enter hosts, anywhere on the menu.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.code === 'Enter' && e.target === document.body ) {
                const form = document.getElementById( MENU_FORM );
                if ( form instanceof HTMLFormElement ) form.requestSubmit();
                return;
            }
            const dir = KEY_DIR[ e.code ];
            if ( ! dir || e.repeat || e.altKey || e.ctrlKey || e.metaKey || typing( e.target ) ) return;
            e.preventDefault();
            cycleShip( dir );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [] );

    return (
        <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className={ `float-left mb-1.5 w-full ${ LABEL } flex` }>
                <span>Ship</span>
                <span className="font-normal tracking-[0.16em]">Class · { SHIP_CLASSES[ hull.classId ].name }</span>
            </legend>
            <div className="clear-left flex items-stretch border border-readout/20 bg-deep">
                <button type="button" aria-label="Previous ship" className={ STEP } onClick={ () => cycleShip( -1 ) }>
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
                <button type="button" aria-label="Next ship" className={ STEP } onClick={ () => cycleShip( 1 ) }>
                    <Chevron dir="right" />
                </button>
            </div>
            <input type="hidden" name="ship" value={ ship.id } />
        </fieldset>
    );
}
