import type { Entity } from 'koota';
import { Shield } from './shield.traits';

export function mirrorShield( ent: Entity | undefined, on: boolean ): void {
    if ( ! ent ) return;
    const now = performance.now() / 1000;
    ent.set( Shield, ( prev ) => ( on ? { on, since: now, popAt: -1 } : { ...prev, on } ) );
}

export function popShield( ent: Entity | undefined ): void {
    ent?.set( Shield, ( prev ) => ( { ...prev, on: false, popAt: performance.now() / 1000 } ) );
}
