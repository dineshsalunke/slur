import type { Room } from '@colyseus/sdk';
import { type RunState, SET_COLOR_MESSAGE } from '@slur/shared';
import { LABEL } from '../../ui/field-label';
import { COLORS } from '../colors';
import { useRunView } from '../net/use-run-view';

export function ColourSwatches( { room }: { room: Room< RunState > } ) {
    const view = useRunView( room );
    const colorId = view.players.find( ( p ) => p.id === view.selfId )?.colorId;

    return (
        <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className={ `float-left mb-1.5 w-full ${ LABEL } flex` }>Colour</legend>
            <div className="clear-left grid w-max grid-cols-6 gap-2">
                { COLORS.map( ( hex, id ) => (
                    <button
                        key={ hex }
                        type="button"
                        aria-label={ `Colour ${ id + 1 }` }
                        aria-pressed={ colorId === id }
                        className={ `size-[22px] cursor-pointer p-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-readout/60 ${ colorId === id ? 'outline-2 outline-readout' : '' }` }
                        style={ { background: hex } }
                        onClick={ () => room.send( SET_COLOR_MESSAGE, id ) }
                    />
                ) ) }
            </div>
        </fieldset>
    );
}
