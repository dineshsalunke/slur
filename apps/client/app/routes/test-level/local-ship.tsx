import { DEFAULT_SHIP, SHIP_ORDER } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { LocalPlayer, Net, Prev, Render, Sim } from '../../game/ecs/traits';
import { attachKeyboard } from '../../game/input/keyboard';
import { localRole } from '../../game/spectator';

export function LocalShip() {
    const world = useWorld();

    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — syncs with an external system: the koota ECS world (module singleton), which needs
    useEffect( () => {
        localRole.spectating = false;
        const ship = world.spawn(
            Render,
            Net( { sessionId: 'test-level', shipId: DEFAULT_SHIP as string, colorId: 0 } ),
            Sim,
            Prev,
            LocalPlayer,
        );
        return () => ship.destroy();
    }, [ world ] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard (1-5) → the ECS Net trait. No server
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            const n = Number( e.key );
            if ( ! ( n >= 1 && n <= SHIP_ORDER.length ) ) return;
            const ship = world.queryFirst( LocalPlayer, Net );
            const cur = ship?.get( Net );
            if ( ship && cur ) ship.set( Net, { ...cur, shipId: SHIP_ORDER[ n - 1 ] } );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ world ] );

    return null;
}
