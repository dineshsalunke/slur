import { DEFAULT_SHIP, isShipId, SHIP_ORDER, type ShipId } from '@slur/shared';
import { useSyncExternalStore } from 'react';

export const SHIP_KEY = 'slur:ship';

export interface ShipChoice {
    id: ShipId;
    dir: -1 | 0 | 1;
    turn: number;
}

function saved(): ShipId {
    try {
        const id = globalThis.localStorage?.getItem( SHIP_KEY );
        return isShipId( id ) ? id : DEFAULT_SHIP;
    } catch {
        return DEFAULT_SHIP;
    }
}

let choice: ShipChoice = { id: saved(), dir: 0, turn: 0 };
const listeners = new Set< () => void >();

export function currentShip(): ShipChoice {
    return choice;
}

export function cycleShip( dir: -1 | 1 ): void {
    const at = SHIP_ORDER.indexOf( choice.id );
    const id = SHIP_ORDER[ ( at + dir + SHIP_ORDER.length ) % SHIP_ORDER.length ];
    choice = { id, dir, turn: choice.turn + 1 };
    try {
        localStorage.setItem( SHIP_KEY, id );
    } catch {}
    for ( const notify of listeners ) notify();
}

export function useShipChoice(): ShipChoice {
    return useSyncExternalStore(
        ( notify ) => {
            listeners.add( notify );
            return () => listeners.delete( notify );
        },
        currentShip,
        currentShip,
    );
}
