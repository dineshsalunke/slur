import { createSimWorld } from '@slur/shared';

export const blockWorld = createSimWorld();

export const confirmedBroken = new Set< number >();

export function clearBlockState(): void {
    blockWorld.broken.clear();
    confirmedBroken.clear();
}

export function confirmBreak( id: number ): void {
    confirmedBroken.add( id );
    blockWorld.broken.add( id );
}

export function unconfirmBreak( id: number ): void {
    confirmedBroken.delete( id );
    blockWorld.broken.delete( id );
}

export function restoreConfirmed(): void {
    blockWorld.broken.clear();
    for ( const id of confirmedBroken ) blockWorld.broken.add( id );
}
