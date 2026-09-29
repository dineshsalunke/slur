import { type FireDir, HeldPower, POWER_SLOTS } from '@slur/shared';
import { useSyncExternalStore } from 'react';
import type { Action } from './actions';

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

function nextFull( rack: readonly number[], from: number, dir: 1 | -1 = 1 ): number {
    for ( let step = 1; step <= POWER_SLOTS; step++ ) {
        const i = ( from + dir * step + POWER_SLOTS * step ) % POWER_SLOTS;
        if ( ( rack[ i ] ?? HeldPower.none ) !== HeldPower.none ) return i;
    }
    return -1;
}

function cycle( rack: readonly number[], dir: 1 | -1 ): void {
    const next = nextFull( rack, selected, dir );
    select( next >= 0 ? next : ( selected + dir + POWER_SLOTS ) % POWER_SLOTS );
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
    fire( slot: number, dir: FireDir ): void;
    drop( slot: number ): void;
    tick(): void;
}

export function runPowerAction( action: Action, act: PowerActions ): void {
    const before = selected;
    if ( action === 'next' ) cycle( act.rack(), 1 );
    else if ( action === 'previous' ) cycle( act.rack(), -1 );
    else if ( action === 'fireForward' ) act.fire( selected, 1 );
    else if ( action === 'fireBack' ) act.fire( selected, -1 );
    else if ( action === 'drop' ) act.drop( selected );
    if ( selected !== before ) act.tick();
}
