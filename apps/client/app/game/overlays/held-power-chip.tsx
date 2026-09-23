import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { HeldPower, type RunState } from '@slur/shared';
import { useEffect, useState } from 'react';
import { HudPanel } from '../../ui/hud-panel';

const LABEL: Record< number, string > = { [ HeldPower.bolt ]: 'BOLT', [ HeldPower.seeker ]: 'SEEKER' };

export function HeldPowerChip( { room }: { room: Room< RunState > } ) {
    const [ held, setHeld ] = useState< number >( HeldPower.none );

    // JUSTIFIED EFFECT — syncs with an external system: the local player's schema field (NOT React-reactive).
    useEffect( () => {
        const $ = getStateCallbacks( room );
        let offField: ( () => void ) | undefined;
        const offAdd = $( room.state ).players.onAdd( ( p, sid ) => {
            if ( sid !== room.sessionId ) return;
            offField = $( p ).listen( 'heldPower', ( v ) => setHeld( v ) );
        } );
        return () => {
            offField?.();
            offAdd();
        };
    }, [ room ] );

    if ( held === HeldPower.none ) return null;
    return (
        <HudPanel
            accent="gold"
            className="fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 px-3 py-1.5 font-mono text-[14px] font-bold leading-none tracking-[2px]"
        >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] border border-gold text-[12px] text-gold">
                E
            </span>
            <span className="text-gold text-shadow-power">{ LABEL[ held ] ?? '—' }</span>
        </HudPanel>
    );
}
