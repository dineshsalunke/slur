import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { pickupsOf, type RunState, type Track } from '@slur/shared';
import { useEffect, useMemo } from 'react';
import { BoltPickups } from './bolt-pickups';

export function PickupField( { room, track }: { room: Room< RunState >; track: Track } ) {
    const layout = useMemo( () => pickupsOf( track ), [ track ] );
    const taken = useMemo( () => new Set< string >(), [] );
    const isTaken = useMemo( () => ( id: string ) => taken.has( id ), [ taken ] );

    // Effect justified: subscribes to the pickupTaken MapSchema, which mutates over the wire outside React
    useEffect( () => {
        const apply = ( id: string, on: boolean ) => {
            if ( on ) taken.add( id );
            else taken.delete( id );
        };
        const $ = getStateCallbacks( room );
        const onTaken = ( v: boolean, id: string ) => apply( id, v === true );
        const offAdd = $( room.state ).pickupTaken.onAdd( onTaken );
        const offChange = $( room.state ).pickupTaken.onChange( onTaken );
        const offRemove = $( room.state ).pickupTaken.onRemove( ( _v, id ) => apply( id, false ) );
        return () => {
            offAdd();
            offChange();
            offRemove();
            taken.clear();
        };
    }, [ room, taken ] );

    return <BoltPickups layout={ layout } isTaken={ isTaken } />;
}
