import { classOfShip, isShipId, SHIP_ORDER, shipOf } from '@slur/shared';
import { chooseShip, useDeckState } from './take-recorder';

export function ShipPicker() {
    const { phase, shipId } = useDeckState();

    return (
        <label className="flex items-center gap-2">
            <span className="w-10 text-dim">Ship</span>
            <select
                value={ shipId }
                disabled={ phase === 'recording' || phase === 'starting' }
                className="border border-line-2 bg-deep px-2 py-1 text-hud"
                onChange={ ( e ) => {
                    const next = e.currentTarget.value;
                    e.currentTarget.blur();
                    if ( isShipId( next ) ) chooseShip( next );
                } }
            >
                { SHIP_ORDER.map( ( id ) => (
                    <option key={ id } value={ id }>
                        { shipOf( id ).name } ({ classOfShip( id ).name })
                    </option>
                ) ) }
            </select>
        </label>
    );
}
