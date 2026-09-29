import { type FireDir, HeldPower, POWER_SLOTS } from '@slur/shared';
import { useSyncExternalStore } from 'react';
import { typingTarget } from '../../dev/typing-target';

const SLOT_KEYS = [ 'Digit1', 'Digit2', 'Digit3' ];

export const NEXT_SLOT_KEY = 'ArrowUp';
export const PREVIOUS_SLOT_KEY = 'PreviousSlot';

export const FIRE_KEY = 'ControlRight';
export const MAC_FIRE_KEY = 'ShiftLeft';
export const FIRE_BACK_KEY = 'ShiftRight';
export const DROP_KEY = 'ControlLeft';
export const MAC_DROP_KEY = 'KeyX';

const FIRE_FORWARD_KEYS = [ FIRE_KEY, MAC_FIRE_KEY ];
const DROP_KEYS = [ DROP_KEY, MAC_DROP_KEY ];
const CHORD_KEYS = new Set( [ FIRE_KEY, DROP_KEY, MAC_FIRE_KEY, FIRE_BACK_KEY, NEXT_SLOT_KEY ] );

export function fireKeyFor( mac: boolean ): string {
    return mac ? MAC_FIRE_KEY : FIRE_KEY;
}

export function dropKeyFor( mac: boolean ): string {
    return mac ? MAC_DROP_KEY : DROP_KEY;
}

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

export function handlePowerKey( e: KeyboardEvent, act: PowerActions ): void {
    if ( e.repeat || e.metaKey || e.altKey || typingTarget( e.target ) ) return;
    if ( ( e.ctrlKey || e.shiftKey ) && ! CHORD_KEYS.has( e.code ) ) return;
    const before = selected;
    const digit = SLOT_KEYS.indexOf( e.code );
    if ( digit >= 0 ) select( digit );
    else if ( e.code === NEXT_SLOT_KEY ) cycle( act.rack(), 1 );
    else if ( e.code === PREVIOUS_SLOT_KEY ) cycle( act.rack(), -1 );
    else if ( FIRE_FORWARD_KEYS.includes( e.code ) ) act.fire( selected, 1 );
    else if ( e.code === FIRE_BACK_KEY ) act.fire( selected, -1 );
    else if ( DROP_KEYS.includes( e.code ) ) act.drop( selected );
    if ( selected !== before ) act.tick();
}
