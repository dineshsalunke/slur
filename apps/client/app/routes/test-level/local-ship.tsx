import { DEFAULT_SHIP, SHIP_ORDER } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { Held, Hover, LocalPlayer, Net, Prev, Render, Sim } from '../../game/ecs/traits';
import { attachKeyboard } from '../../game/input/keyboard';
import { handlePowerKey } from '../../game/input/power-select';
import { localRole } from '../../game/spectator';
import { queueDrop, queueFire } from './local-combat';

export function LocalShip() {
    const world = useWorld();

    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — syncs with an external system: the koota ECS world (module singleton), which needs
    useEffect( () => {
        localRole.spectating = false;
        const ship = world.spawn(
            Render,
            Hover,
            Net( { sessionId: 'test-level', shipId: DEFAULT_SHIP as string, colorId: 0 } ),
            Sim,
            Prev,
            LocalPlayer,
        );
        return () => ship.destroy();
    }, [ world ] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard → power slots and the Shift+1-5 ECS ship class.
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
