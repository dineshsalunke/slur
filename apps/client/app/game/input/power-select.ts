import { HeldPower, POWER_SLOTS } from '@slur/shared';
import { useSyncExternalStore } from 'react';
import { typingTarget } from '../../dev/typing-target';

const SLOT_KEYS = [ 'Digit1', 'Digit2', 'Digit3' ];

const listeners = new Set< () => void >();

let selected = 0;

function subscribe( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function selectedSlot(): number {
    return selected;
}

export function useSelectedSlot(): number {
    return useSyncExternalStore( subscribe, selectedSlot, selectedSlot );
}

function select( slot: number ): void {
    if ( slot === selected ) return;
    selected = slot;
    for ( const listener of listeners ) listener();
}

function nextFull( rack: readonly number[], from: number ): number {
    for ( let step = 1; step <= POWER_SLOTS; step++ ) {
        const i = ( from + step ) % POWER_SLOTS;
        if ( ( rack[ i ] ?? HeldPower.none ) !== HeldPower.none ) return i;
    }
    return -1;
}

export function settleSlot( rack: readonly number[] ): void {
    if ( ( rack[ selected ] ?? HeldPower.none ) !== HeldPower.none ) return;
    const next = nextFull( rack, selected );
    if ( next >= 0 ) select( next );
}

export function resetSlot(): void {
    select( 0 );
}

export interface PowerActions {
    rack(): readonly number[];
    fire( slot: number ): void;
    drop( slot: number ): void;
}

export function handlePowerKey( e: KeyboardEvent, act: PowerActions ): void {
    if ( e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || typingTarget( e.target ) ) return;
    const digit = SLOT_KEYS.indexOf( e.code );
    if ( digit >= 0 ) select( digit );
    else if ( e.code === 'KeyQ' ) {
        const next = nextFull( act.rack(), selected );
        select( next >= 0 ? next : ( selected + 1 ) % POWER_SLOTS );
    } else if ( e.code === 'KeyE' ) act.fire( selected );
    else if ( e.code === 'KeyX' ) act.drop( selected );
}
