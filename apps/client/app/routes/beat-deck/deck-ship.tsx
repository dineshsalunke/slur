import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { Hover, LocalPlayer, Net, Prev, Render, Sim } from '../../game/ecs/traits';
import { attachKeyboard } from '../../game/input/keyboard';
import { localRole } from '../../game/spectator';
import { deckState } from './take-recorder';

export function DeckShip() {
    const world = useWorld();

    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — syncs with an external system: the koota ECS world (module singleton) that owns the ship entity.
    useEffect( () => {
        localRole.spectating = false;
        const ship = world.spawn(
            Render,
            Hover,
            Net( { sessionId: 'beat-deck', shipId: deckState().shipId, colorId: 0 } ),
            Sim,
            Prev,
            LocalPlayer,
        );
        return () => ship.destroy();
    }, [ world ] );

    return null;
}
