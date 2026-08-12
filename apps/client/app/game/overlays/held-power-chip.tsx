import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { HeldPower, type RunState } from '@slur/shared';
import { useEffect, useState } from 'react';
import { HudPanel } from '../../ui/hud-panel';

// The names shown in the chip, indexed by HeldPower value. Empty slot renders nothing.
const LABEL: Record< number, string > = { [ HeldPower.bolt ]: 'BOLT' };

// The local player's held power-up slot — a tiny DOM chip (E:[BOLT] when armed, hidden when empty). A LEAF
// that subscribes to ONLY the local PlayerState.heldPower via a change-gated .listen, so it re-renders when the
// slot actually flips, NOT at the 20Hz patch cadence — and never reads room.state during render (not reactive).
export function HeldPowerChip( { room }: { room: Room< RunState > } ) {
    const [ held, setHeld ] = useState< number >( HeldPower.none );

    // JUSTIFIED EFFECT — syncs with an external system: the local player's schema field (NOT React-reactive).
    //  1) render-derivation? no — heldPower arrives as a schema delta over the wire; nothing to derive.
    //  2) event handler? no DOM/user event — a network callback the effect registers.
    //  3) loader/action data? no — a live per-change stream; the loader OWNS the room, this only SUBSCRIBES.
    //  4) ref/module singleton? the room is loader-owned (prop); only the listener needs mount teardown.
    //  5) external sync? YES — schema .listen → setState. VERDICT: keep. Cleanup detaches; never touches the socket.
    useEffect( () => {
        const $ = getStateCallbacks( room );
        let offField: ( () => void ) | undefined;
        // onAdd fires immediately for an already-present local player, then .listen fires immediately with the
        // current value — so the chip seeds correctly whether we mount before or after the player exists.
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
