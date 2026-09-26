import { DEFAULT_SHIP, SHIP_ORDER } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { Attitude, Held, Hover, LocalPlayer, Net, Prev, Render, Sim } from '../../game/ecs/traits';
import { attachKeyboard } from '../../game/input/keyboard';
import { handlePowerKey } from '../../game/input/power-select';
import { localRole } from '../../game/spectator';
import { queueDrop, queueFire } from './local-combat';

export function LocalShip() {
    const world = useWorld();

    // Syncs with the browser keyboard: window keydown and keyup drive the local input.
    useEffect( attachKeyboard, [] );

    // Syncs with the koota world, a module singleton: spawns the local ship entity and destroys it at unmount.
    useEffect( () => {
        localRole.spectating = false;
        const ship = world.spawn(
            Render,
            Hover,
            Attitude,
            Net( { sessionId: 'test-level', shipId: DEFAULT_SHIP as string, colorId: 0 } ),
            Sim,
            Prev,
            LocalPlayer,
        );
        return () => ship.destroy();
    }, [ world ] );

    // Syncs with the browser keyboard: the power-slot keys, and Shift+1-5 set the ECS ship class.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            handlePowerKey( e, {
                rack: () => world.queryFirst( LocalPlayer, Held )?.get( Held )?.slots ?? [],
                fire: queueFire,
                drop: queueDrop,
            } );
            const shipId = e.shiftKey ? SHIP_ORDER[ Number( e.code.replace( 'Digit', '' ) ) - 1 ] : undefined;
            if ( ! e.code.startsWith( 'Digit' ) || ! shipId ) return;
            const ship = world.queryFirst( LocalPlayer, Net );
            const cur = ship?.get( Net );
            if ( ship && cur ) ship.set( Net, { ...cur, shipId } );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ world ] );

    return null;
}
