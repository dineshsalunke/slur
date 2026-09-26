import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { Attitude, Hover, LocalPlayer, Net, Prev, Render, Sim } from '../../game/ecs/traits';
import { attachKeyboard } from '../../game/input/keyboard';
import { localRole } from '../../game/spectator';
import { deckState } from './take-recorder';

export function DeckShip() {
    const world = useWorld();

    // Syncs with the browser keyboard: window keydown and keyup drive the local input.
    useEffect( attachKeyboard, [] );

    // Syncs with the koota world, a module singleton: spawns the deck ship entity and destroys it at unmount.
    useEffect( () => {
        localRole.spectating = false;
        const ship = world.spawn(
            Render,
            Hover,
            Attitude,
            Net( { sessionId: 'beat-deck', shipId: deckState().shipId, colorId: 0 } ),
            Sim,
            Prev,
            LocalPlayer,
        );
        return () => ship.destroy();
    }, [ world ] );

    return null;
}
